import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger } from '../logger/logger.interface';
import { ParsedQs } from 'qs';

export type ValidateSource = 'body' | 'query' | 'params' | 'headers';

type FormattedError = {
	field: string;
	constraints: string[];
	value: unknown;
};

type ValidationOptions = {
	skipMissingProperties?: boolean;
	whitelist?: boolean;
	forbidNonWhitelisted?: boolean;
	transformOptions?: {
		excludeExtraneousValues?: boolean;
		exposeUnsetFields?: boolean;
		exposeDefaultValues?: boolean;
	};
	errorFormatter?: (errors: ValidationError[]) => FormattedError[];
};

type RequestData = unknown | Record<string, unknown>;

@injectable()
export class ValidateMiddleware implements IMiddleware {
	constructor(
		@inject(TYPES.ILogger) private readonly logger: ILogger,
		private classToValidate: ClassConstructor<object>,
		private source: ValidateSource = 'body',
		private options?: ValidationOptions,
	) {}

	async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
		const startTime = Date.now();
		try {
			const data = this.extractData(req);

			const instance = plainToInstance(
				this.classToValidate,
				data,
				this.options?.transformOptions || {
					excludeExtraneousValues: false,
					exposeUnsetFields: true,
					exposeDefaultValues: false,
				},
			);

			const errors = await validate(instance, {
				skipMissingProperties: this.options?.skipMissingProperties || false,
				whitelist: this.options?.whitelist || true,
				forbidNonWhitelisted: this.options?.forbidNonWhitelisted || true,
			});

			const duration = Date.now() - startTime;

			if (errors.length > 0) {
				this.handleValidationErrors(errors, duration, req, res);
				return;
			}

			this.updateRequestData(req, instance);
			next();
		} catch (error: unknown) {
			this.handleError(error, startTime, req, res);
		}
	}

	private extractData(req: Request): RequestData {
		switch (this.source) {
			case 'body':
				return req.body;
			case 'query':
				return req.query;
			case 'params':
				return req.params;
			default:
				return req.body;
		}
	}

	private updateRequestData(req: Request, instance: object): void {
		switch (this.source) {
			case 'body':
				req.body = instance;
				break;
			case 'query':
				req.query = instance as unknown as ParsedQs;
				break;
			case 'params':
				req.params = instance as Record<string, string>;
				break;
		}
	}

	private handleValidationErrors(
		errors: ValidationError[],
		duration: number,
		req: Request,
		res: Response,
	): void {
		const formattedErrors = this.options?.errorFormatter
			? this.options.errorFormatter(errors)
			: this.formatErrors(errors);

		this.logger.error(
			`Validation failed for ${this.source}`,
			JSON.stringify({
				classToValidate: this.classToValidate.name,
				source: this.source,
				errors: formattedErrors,
				duration: `${duration}ms`,
				url: req.url,
				method: req.method,
			}),
		);

		res.status(422).json({
			statusCode: 422,
			errors: formattedErrors,
		});
	}

	private handleError(error: unknown, startTime: number, req: Request, res: Response): void {
		const duration = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

		this.logger.error(
			`Validation middleware error`,
			JSON.stringify({
				error: errorMessage,
				classToValidate: this.classToValidate.name,
				source: this.source,
				duration: `${duration}ms`,
				url: req.url,
				method: req.method,
				body: req.body,
				query: req.query,
				params: req.params,
			}),
		);

		res.status(500).json({
			statusCode: 500,
			error: errorMessage,
		});
	}

	private formatErrors(errors: ValidationError[]): FormattedError[] {
		return errors.map((error) => ({
			field: error.property,
			constraints: error.constraints ? Object.values(error.constraints) : [],
			value: error.value,
		}));
	}
}
