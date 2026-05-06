# SAM Lambda Template

Scaffolding for new AWS Lambda projects at The Humane League. Includes automatic build and deploy to AWS on every merge to `main` via GitHub Actions.

---

## Starting a new project

### 1. Create a repo from this template

On GitHub, click **Use this template → Create a new repository**. Name it after the project (e.g. `member-organization-sync`). The repo name becomes the CloudFormation stack name and the Secrets Manager secret path.

### 2. Clone and update `template.yaml`

Replace the placeholder `ExampleKey` environment variable with the actual secrets your Lambda needs:

```yaml
Environment:
  Variables:
    STRAPI_URL: !Sub "{{resolve:secretsmanager:prod/${AWS::StackName}/env:SecretString:StrapiUrl}}"
    DATABASE_URL: !Sub "{{resolve:secretsmanager:prod/${AWS::StackName}/env:SecretString:DatabaseUrl}}"
```

`${AWS::StackName}` is a CloudFormation built-in that resolves to the stack name at deploy time. The CI workflow sets the stack name to the GitHub repo name, so for a repo called `member-organization-sync` this resolves to `prod/member-organization-sync/env` — no hardcoding needed.

### 3. Install dependencies

```bash
npm install
```

### 4. Write your Lambda handler

Edit `src/handler.ts`. The connection to `template.yaml` works like this:

- `CodeUri: src/` tells SAM where your source lives
- `Metadata.BuildMethod: esbuild` tells SAM to bundle it with esbuild during `sam build`
- `Handler: handler.handler` tells Lambda which file and export to invoke — `handler` (the filename, without `.ts`) dot `handler` (the exported function name)

If you rename the file or the export, update the `Handler` field in `template.yaml` to match.

### 5. Merge to `main`

The GitHub Actions workflow will:

1. Authenticate to AWS via OIDC (no stored credentials)
2. Create `prod/{repo-name}/env` in Secrets Manager with `PLACEHOLDER` values for each key found in `template.yaml` — **if it doesn't already exist**
3. Run `sam build && sam deploy`

The deploy will succeed, but the Lambda will error on invocation until real secret values are set. Check the Actions run summary for a notice listing which secret needs to be updated.

### 6. Set real secret values

Go to **AWS Console → Secrets Manager → `prod/{repo-name}/env`** and replace each `PLACEHOLDER` with the real value. The Lambda will pick them up on the next invocation — no redeploy needed.

---

## Subsequent deploys

Push to a feature branch, open a PR, merge to `main` — the workflow runs automatically. The secret bootstrap step is a no-op once the secret exists.

---

## Local development

For local invocation, secrets aren't resolved from Secrets Manager — you supply them via a local `env.json` file instead.

Copy the example and fill in real values (this file is gitignored):

```bash
cp env.json.example env.json
```

Then invoke locally:

```bash
sam build
sam local invoke MyFunction --env-vars env.json
```

For a guided deploy to set up `samconfig.toml` with your local defaults:

```bash
sam deploy --guided
```

---

## Adding non-secret environment variables

Use `template.yaml` directly — no Secrets Manager needed:

```yaml
Environment:
  Variables:
    LOG_LEVEL: INFO
    STRAPI_URL: !Sub "{{resolve:secretsmanager:prod/${AWS::StackName}/env:SecretString:StrapiUrl}}"
```

Non-secret vars should also be added to `env.json.example` so local invocation works without extra setup.
