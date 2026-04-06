export interface IPasswordHasher {
	hash(plainTextPassword: string): Promise<string>;
	compare(plainTextPassword: string, hash: string): Promise<boolean>;
}
