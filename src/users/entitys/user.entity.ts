import { UserIdResponse } from '../dto/user-id.response';

export class UserEntity {
	private _id?: number;
	private _name: string;
	private _email: string;
	private _passwordHash: string = '';
	private _createdAt: Date;
	private _updatedAt: Date;

	constructor(name: string, email: string) {
		this._name = name;
		this._email = email;
		this._createdAt = new Date();
		this._updatedAt = new Date();
	}

	get id(): number | undefined {
		return this._id;
	}

	get name(): string {
		return this._name;
	}

	get email(): string {
		return this._email;
	}

	get passwordHash(): string {
		return this._passwordHash;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}

	setId(id: number): void {
		this._id = id;
	}

	setPasswordHash(hash: string): void {
		this._passwordHash = hash;
	}
}
