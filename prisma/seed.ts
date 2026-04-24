// prisma/seed.ts
import { PrismaClient, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIG = {
  USERS_COUNT: 5,
  PROJECTS_PER_USER: 2,
  TASKS_PER_PROJECT: 3,
  TIME_LOGS_PER_TASK: 2,
  DATE_RANGE_DAYS: 30, 
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomDuration = (): number => {

  const minutes = randomInt(5, 480);
  return minutes * 60 * 1000;
};

const randomStatus = (): TaskStatus => {
  const statuses = [TaskStatus.CREATED, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];
  const weights = [0.1, 0.3, 0.6]; 
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return statuses[i];
  }
  return TaskStatus.CREATED;
};

const randomName = (): string => {
  const firstNames = ['Иван', 'Мария', 'Алексей', 'Елена', 'Дмитрий', 'Анна', 'Сергей', 'Ольга', 'Андрей', 'Татьяна'];
  const lastNames = ['Петров', 'Сидорова', 'Иванов', 'Кузнецова', 'Смирнов', 'Волкова', 'Попов', 'Соколова'];
  return `${firstNames[randomInt(0, firstNames.length - 1)]} ${lastNames[randomInt(0, lastNames.length - 1)]}`;
};

const randomEmail = (name: string, index: number): string => {
  const domains = ['example.com', 'test.com', 'company.com', 'dev.com'];
  const translit = name.toLowerCase().replace(/ /g, '.');
  return `${translit}.${index}@${domains[randomInt(0, domains.length - 1)]}`;
};

const randomProjectName = (index: number): string => {
  const names = [
    'CRM Система', 'API Gateway', 'Админ-панель', 'Мобильное приложение',
    'Блог платформа', 'E-commerce сайт', 'Аналитический дашборд', 'Чат-бот',
    'Система учета', 'Платежный шлюз', 'Маркетплейс', 'Социальная сеть'
  ];
  return `${names[randomInt(0, names.length - 1)]} ${index}`;
};

const randomTaskTitle = (): string => {
  const titles = [
    'Разработать API', 'Написать документацию', 'Исправить баги', 'Рефакторинг кода',
    'Настроить CI/CD', 'Создать UI компоненты', 'Оптимизировать запросы', 'Добавить тесты',
    'Настроить логирование', 'Обновить зависимости', 'Создать миграции', 'Добавить аутентификацию'
  ];
  return titles[randomInt(0, titles.length - 1)];
};

const randomTaskDescription = (title: string): string => {
  const descriptions = [
    `Реализовать функционал для ${title.toLowerCase()}`,
    `Провести анализ и улучшить ${title.toLowerCase()}`,
    `Создать документацию и примеры использования для ${title.toLowerCase()}`,
    `Оптимизировать производительность ${title.toLowerCase()}`,
    `Покрыть тестами ${title.toLowerCase()}`,
  ];
  return descriptions[randomInt(0, descriptions.length - 1)];
};


async function main() {
  console.log('🚀 Начинаем заполнение базы данных...');
  console.log(`Конфигурация: ${CONFIG.USERS_COUNT} пользователей, ${CONFIG.PROJECTS_PER_USER} проектов на пользователя`);

  console.log('🧹 Очищаем существующие данные...');
  await prisma.timeLogModel.deleteMany();
  await prisma.taskModel.deleteMany();
  await prisma.projectModel.deleteMany();
  await prisma.userModel.deleteMany();
  console.log('✅ Существующие данные удалены');

  const users = [];
  const projects = [];
  const tasks = [];
  const timeLogs = [];

  console.log('👥 Создаем пользователей...');
  for (let i = 1; i <= CONFIG.USERS_COUNT; i++) {
    const name = randomName();
    const user = await prisma.userModel.create({
      data: {
        name: name,
        email: randomEmail(name, i),
        hasPassword: '$2b$10$YourHashedPasswordHere', 
      }
    });
    users.push(user);
    console.log(`  ✅ Создан пользователь: ${user.name} (${user.email})`);
  }

  console.log('📁 Создаем проекты...');
  for (const user of users) {
    for (let j = 1; j <= CONFIG.PROJECTS_PER_USER; j++) {
      const project = await prisma.projectModel.create({
        data: {
          name: randomProjectName(j),
          description: `Проект ${j} пользователя ${user.name}`,
          userId: user.id
        }
      });
      projects.push(project);
      console.log(`  ✅ Создан проект: ${project.name} (владелец: ${user.name})`);
    }
  }

  console.log('📝 Создаем задачи...');
  for (const project of projects) {
    const executorUsers = [...users];
    
    for (let k = 1; k <= CONFIG.TASKS_PER_PROJECT; k++) {
      const status = randomStatus();
      const dueDate = randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      const completedAt = status === TaskStatus.COMPLETED 
        ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date())
        : null;
      
      const executor = executorUsers[randomInt(0, executorUsers.length - 1)];
      const creator = users.find(u => u.id === project.userId)!;
    
      const task = await prisma.taskModel.create({
        data: {
          title: randomTaskTitle(),
          description: randomTaskDescription(randomTaskTitle()),
          dueDate: dueDate,
          status: status,
          completedAt: completedAt,
          projectId: project.id,
          createUserId: creator.id,
          executorUserId: executor.id
        }
      });
      tasks.push(task);
      console.log(`  ✅ Создана задача: ${task.title} (проект: ${project.name}, исполнитель: ${executor.name})`);
    }
  }

  console.log('⏱️ Создаем временные логи...');
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - CONFIG.DATE_RANGE_DAYS);

  for (const task of tasks) {
   
    if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.IN_PROGRESS) {
      continue;
    }

    const logsCount = randomInt(1, CONFIG.TIME_LOGS_PER_TASK);
    
    for (let l = 1; l <= logsCount; l++) {
      const startedAt = randomDate(startDate, endDate);
      const duration = randomDuration();
      const endedAt = new Date(startedAt.getTime() + duration);

      const finalEndedAt = endedAt > endDate ? endDate : endedAt;
      const finalDuration = finalEndedAt.getTime() - startedAt.getTime();
      
      const timeLog = await prisma.timeLogModel.create({
        data: {
          startedAt: startedAt,
          endedAt: finalEndedAt,
          durationMs: finalDuration > 0 ? finalDuration : null,
          taskId: task.id,
          userId: task.executorUserId || task.createUserId
        }
      });
      timeLogs.push(timeLog);
    }
    console.log(`  ✅ Создано ${logsCount} временных логов для задачи: ${task.title}`);
  }

  console.log('\n📊 Статистика заполнения:');
  console.log(`  👥 Пользователей: ${users.length}`);
  console.log(`  📁 Проектов: ${projects.length}`);
  console.log(`  📝 Задач: ${tasks.length}`);
  console.log(`  ⏱️ Временных логов: ${timeLogs.length}`);
  

  const totalDurationMs = timeLogs.reduce((sum, log) => sum + (log.durationMs || 0), 0);
  const totalHours = (totalDurationMs / (1000 * 60 * 60)).toFixed(2);
  
  console.log(`  ⏰ Общее время работы: ${totalHours} часов`);
  console.log(`  📅 Период: с ${startDate.toLocaleDateString()} по ${endDate.toLocaleDateString()}`);
  
  console.log('\n✅ Заполнение базы данных успешно завершено!');
}


main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });