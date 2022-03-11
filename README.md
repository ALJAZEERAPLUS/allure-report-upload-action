# Allure Report Upload Github Action

GitHub Actions to upload the Allure report using the [allure-docker-service](https://github.com/fescobar/allure-docker-service) API. All the action was based on the project created by [fescobar](https://github.com/fescobar). 

## Inputs

### `allure-results-dir`

**Required** Allure results directory.

### `allure-server-url`

**Required** The URL of allure server.

### `allure-project-id`

**Required** The ID of allure project.

### `run-id`

**Required** The Github Actions Workflow Run ID.

## Sample usage

```yml
name: Build and Test

on: [push]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    environment:
      name: allure
      url: ${{ steps.get_job_url.outputs.url_output }}
    steps:
      - uses: actions/checkout@v2.4.0
      - run: npm install
      - run: bundle exec fastlane build_release_bundle

      - name: Deploy to Sauce Labs
        uses: ALJAZEERAPLUS/sauce-labs-storage-action@v1.0
        id: saucelabs_upload
        with:
          file-path: "./artifacts/${{ env.app_file }}"
          sauce-labs-username: ${{ secrets.SAUCELABS_USERNAME }}
          sauce-labs-access-key: ${{ secrets.SAUCELABS_ACCESS_KEY }}

      - name: Run Functional Tests
        env:
          APP_FILE_ID: ${{ steps.saucelabs_upload.outputs.file-id }}
          SAUCE_USERNAME: ${{ secrets.SAUCELABS_USERNAME }}
          SAUCE_ACCESS_KEY: ${{ secrets.SAUCELABS_ACCESS_KEY }}
          PLATFORM_VERSION: ${{ secrets.SAUCELABS_ANDROID_PLATFORM_VERSION }}
          PLATFORM_NAME: 'android'
          DEVICE_NAME: '^(?!(Google Pixel 3 XL)|(Google Pixel 3a XL)|(Google Pixel 4a)|(Google Pixel 5)$).*$'
          PHONE_ONLY: "true"
          BRANCH_NAME: ${{ env.BRANCH_NAME }}
        run: yarn run test:remote-e2e

      - name: Upload Allure Results
        id: upload-allure-results
        uses: ALJAZEERAPLUS/allure-report-upload-action@v1.0
        with:
          allure-results-dir: tests/e2e/output/report
          allure-project-id: ump-android
          allure-server-url: http://allure-server.aj-plus.net/allure-docker-service
          
      - run: echo ::set-output name=url_output::${{ steps.upload-allure-results.outputs.allure-report-url }}
        id: get_job_url
```

## :gear: Inputs

| Name               | Description                         |        Default        | Required |
| ------------------ | ----------------------------------- | :-------------------: | :------- |
| allure-results-dir | Allure results directory.           |                       | True     |
| allure-server-url  | The URL of allure server.           | http://localhost:5050 | True     |
| allure-project-id  | The ID of allure project.           |                       | True     |
| run-id             | The path to the APK file to deploy. | ${{ github.run_id }}  | False    |

## :gear: Outputs

| Name              | Description              |
| ----------------- | ------------------------ |
| allure-report-url | The URL of allure report |

## :thought_balloon: Support

If you find our work useful, but for some reason there is something missing, please raise a pull request to us review it!
