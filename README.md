<p align="center">
  <a href="http://codinglegends.io/" target="blank"><img src="coding_legends_logo.svg" width="120" alt="Coding Legends Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">SkyPass - A comprehensive Access Permit management system.</p>

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Code Quality & Formatting

This project uses **Husky** and **lint-staged** to ensure code quality before commits. All code must pass linting and formatting checks before being committed.

### Pre-commit Hooks

The project is configured with pre-commit hooks that automatically:

- Run ESLint with auto-fix on staged TypeScript/JavaScript files
- Format code with Prettier on staged files
- Perform full project code quality checks

### Manual Code Formatting Commands

```bash
# Check code quality (linting + formatting)
$ npm run code:check

# Fix code quality issues automatically
$ npm run code:fix

# Run linting only
$ npm run lint:check

# Fix linting issues automatically
$ npm run lint:fix

# Check formatting only
$ npm run format:check

# Format all files
$ npm run format
```

### Before Committing

1. **Stage your changes:**

   ```bash
   git add .
   ```

2. **The pre-commit hook will automatically:**
   - Run ESLint with `--fix` on staged `.ts` and `.js` files
   - Run Prettier on staged files
   - Perform full project code quality checks
   - **Block the commit** if any issues remain

3. **If the commit is blocked:**
   - Fix the remaining issues manually
   - Run `npm run code:fix` to auto-fix what's possible
   - Stage the fixed files again
   - Try committing again

4. **If intentionally want avoid unused lint error:**

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
```

### Commit Workflow

```bash
# 1. Make your changes
# 2. Stage files
git add .

# 3. Commit (pre-commit hook runs automatically)
git commit -m "your commit message"

# If commit fails due to linting issues:
# 4. Fix issues and re-stage
npm run code:fix
git add .

# 5. Commit again
git commit -m "your commit message"
```

### Bypassing Pre-commit Hooks (Not Recommended)

If you absolutely need to bypass the pre-commit hooks (not recommended for production code):

```bash
git commit -m "your message" --no-verify
```

**⚠️ Warning:** Only use `--no-verify` in emergency situations. All code should pass quality checks before being merged.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Option 1. Add a new module by creating files manually

```bash
# Creating 'demo' module. This will create 3 files.
$ nest g module demo
$ nest g service demo
$ nest g controller demo

# create bookcontroller.ts inside/demo (--flat stop creating a subfolder)
$ nest g controller demo/book --flat

```

```ts
// import the module to 'app.module.ts'
import { UserModule } from './user/user.module';
@Module({
  imports: [UserModule],
})
export class AppModule {}
```

## Option 2. Add a new module with all CRUD & support files

```bash
# Creating 'user' module. This will create 3 files with CRUD endpoints
$ nest g resource user
```

#### Creates a new folder `user/` inside `src/`

- Generate:
  - user.controller.ts — your REST controller
  - user.service.ts — your business logic
  - user.module.ts — the module that wires it all - together
  - DTOs and entity files (if you choose to include them)
  - Register the route in your app (if you choose REST)

## Docker

Use the `dev` container for development

```bash
docker-compose -f docker-compose.dev.yml up --build -d

# of if you want a fresh-build
docker-compose -f docker-compose.dev.yml build  --no-cache

# If needed, go inside Docker terminal (ie:exec) and run following command to seed the data
npm run seed:upgraded
```

## Run tests

```bash
# unit tests
$ npm run test

# contoller test
$ npx jest user.controller

# service test
$ npx jest user.service

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

## Resources

Check out a few resources that may come in handy when working with SkyPass:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).

## Support

[codinglegends.io](https://codinglegends.io)

## Dev Team

- [Stefan](https://codinglegends.io)
- [Azmeer](https://azmeer.info/)
- [Nufail](https://codinglegends.io)
- [Sahan](https://codinglegends.io)
- [Pubudu](https://codinglegends.io)
- [Rajitha](https://codinglegends.io)
- [Sinthu](https://codinglegends.io)
- [Isuri](https://codinglegends.io)

## License

SkyPass - 2025 (c) [Coding Legends](https://codinglegends.io).
