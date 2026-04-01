import 'reflect-metadata';
import { Request, Response, NextFunction } from "express";
import { IMiddleware } from "./middleware.interface";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { inject, injectable } from "inversify";
import { TYPES } from '../types/types';
import { ILogger } from '../logger/logger.interface';

export type ValidateSource = 'body' | 'query' | 'params' | 'headers';

injectable()
export class ValidateMiddleware implements IMiddleware {
    constructor(
        @inject(TYPES.ILogger) private readonly logger: ILogger,
        private classToValidate: ClassConstructor<object>,
        private source: ValidateSource = 'body',
        private options?: {
            skipMissingProperties?: boolean;
            whitelist?: boolean;
            forbidNonWhitelisted?: boolean;
            transformOptions?: {
                excludeExtraneousValues?: boolean;
                exposeUnsetFields?: boolean;
                exposeDefaultValues?: boolean;
            };
            errorFormatter?: (errors: ValidationError[]) => any;
        }
    ) { }

    async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
        const startTime = Date.now();
        try {
            let data: any;
            switch (this.source) {
                case 'body':
                    data = req.body;
                    break;
                case 'query':
                    data = req.query;
                    break;
                case 'params':
                    data = req.params;
                    break;
                default:
                    data = req.body;
            }
            const instance = plainToInstance(
                this.classToValidate,
                data,
                this.options?.transformOptions || {
                    excludeExtraneousValues: false,
                    exposeUnsetFields: true,
                    exposeDefaultValues: false
                }
            );
            const errors = await validate(instance as object, {
                skipMissingProperties: this.options?.skipMissingProperties || false,
                whitelist: this.options?.whitelist || true,
                forbidNonWhitelisted: this.options?.forbidNonWhitelisted || true,
            });

            const duration = Date.now() - startTime;

            if (errors.length > 0) {
                const formattedErrors = this.options?.errorFormatter
                    ? this.options.errorFormatter(errors)
                    : this.formatErrors(errors);

                this.logger.error(` Validation failed for ${this.source}`, JSON.stringify({
                    classToValidate: this.classToValidate.name,
                    source: this.source,
                    errors: formattedErrors,
                    duration: `${duration}ms`,
                    url: req.url,
                    method: req.method
                }));

                res.status(422).json({
                    statusCode: 422,
                    errors: formattedErrors
                });
                return;
            }
            switch (this.source) {
                case 'body':
                    req.body = instance;
                    break;
                case 'query':
                    req.query = instance as any;
                    break;
                case 'params':
                    req.params = instance as any;
                    break;
            }

            next();
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error occurred';

            this.logger.error(`Validation middleware error`, JSON.stringify({
                error: errorMessage,
                classToValidate: this.classToValidate.name,
                source: this.source,
                duration: `${duration}ms`,
                url: req.url,
                method: req.method,
                body: req.body,
                query: req.query,
                params: req.params
            }));

            res.status(500).json({
                statusCode: 500,
                error: errorMessage,
            });
        }
    }

    private formatErrors(errors: ValidationError[]): any[] {
        return errors.map(error => ({
            field: error.property,
            constraints: error.constraints ? Object.values(error.constraints) : [],
            value: error.value,
        }));
    }

}