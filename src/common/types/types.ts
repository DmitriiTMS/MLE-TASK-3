export const TYPES = {
	Application: Symbol.for('Application'),
	IConfigService: Symbol.for('IConfigService'),
	ILogger: Symbol.for('ILogger'),
	IExeptionFilter: Symbol.for('IExeptionFilter'),
	PrismaService: Symbol.for('PrismaService'),
	JwtService: Symbol.for('JwtService'),

	IPasswordHasher: Symbol.for('IPasswordHasher'),

	IAuthController: Symbol.for('IAuthController'),
	IAuthService: Symbol.for('IAuthService'),

	IUserService: Symbol.for('IUserService'),
	IUserRepository: Symbol.for('IUserRepository'),

	IProjectsController: Symbol.for('IProjectsController'),
	IProjectsService: Symbol.for('IProjectsService'),
	IProjectsRepository: Symbol.for('IProjectsRepository'),

	ITasksController: Symbol.for('ITasksController'),
	ITasksService: Symbol.for('ITasksService'),
	ITasksRepository: Symbol.for('ITasksRepository'),
};
