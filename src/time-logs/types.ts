export interface ITimeLogFilters {
	developerId: number;
	projectId?: number;
	startDate?: Date;
	endDate?: Date;
}

export interface IWhereCondition {
	userId: number;
	startedAt?: {
		gte?: Date;
		lte?: Date;
	};
	task?: {
		projectId?: number;
	};
}

export interface IResponseGetDeveloperTime {
	timeLogs: {
		id: number;
		startedAt: Date;
		endedAt: Date | null;
		durationMs: number | null;
		task: {
			id: number;
			title: string;
			status: string;
			project: {
				id: number;
				name: string;
			};
		};
		user: {
			id: number;
			name: string;
		};
	}[];
	stats: {
		totalDurationMs: number;
		totalHours: string;
		uniqueTasksCount: number;
		projectsInvolved: number;
	};
}

export interface IWhereConditionProject {
	startedAt?: {
		gte?: Date;
		lte?: Date;
	};
	task?: {
		projectId?: number;
	};
}

export interface ITimeLogForProjectFilters {
	projectId: number;
	startDate?: Date;
	endDate?: Date;
}

export interface IDeveloperTimeStats {
	developerId: number;
	developerName: string;
	totalDurationMs: number;
	totalHours: string;
	tasksCount: number;
	logsCount: number;
}

export interface IProjectTimeStats {
	projectId: number | null;
	projectName: string | null;
	totalDurationMs: number;
	totalHours: string;
	developersCount: number;
	tasksCount: number;
	logsCount: number;
	developers: IDeveloperTimeStats[];
}

export interface IResponseGetProjectTime {
	projectStats: IProjectTimeStats;
	timeLogs: any[];
}
