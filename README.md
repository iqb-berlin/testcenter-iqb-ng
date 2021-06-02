[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitLab CI Status](https://scm.cms.hu-berlin.de/iqb/testcenter-frontend/badges/master/pipeline.svg)](https://scm.cms.hu-berlin.de/iqb/testcenter-frontend)
![GitHub package.json version](https://img.shields.io/github/package-json/v/iqb-berlin/testcenter-frontend)

# Testcenter Frontend

Diese Angular-Programmierung ist die clientseitige Web-Anwendung für das Online-Testen des IQB. Über diesen Weg wird die Programmierung allen Interessierten zur Verfügung gestellt. Eine Anleitung zum Installieren und Konfigurieren wird schrittweise an dieser Stelle folgen.

***

This is the frontend of the IQB Testcenter application. It's written in Typescript using Angular 9.

You can find the backend [here](https://github.com/iqb-berlin/testcenter-backend).

The repository for a complete setup of the application can be found [here](https://github.com/iqb-berlin/testcenter-setup).


## Installation

### With Docker (recommended)

All the necessary commands for running the application and starting the tests
can be found in the Makefile on the root directory.

###### Prepare config
```
make init-dev-config
```

###### Start and Stop the server
```
make run
make stop
```
###### The 2 types of tests can also be run separately.
*For those to work the containers have to be running.*
```
make test-unit
make test-e2e
```
### Manual Compilation
#### Prerequisites
* node 12+

#### Compilation Steps

```
npm install
ng build --prod
```

Find the compiled app in src folder and open in Browser or serve with `ng serve`.


## Development
### Coding Standards
We are using ESLint with the base or [airbnb](https://www.npmjs.com/package/eslint-config-airbnb) with our [own rules](https://www.npmjs.com/package/@iqb/eslint-config) on top.

## Bug Reports

File bug reports, feature requests etc. [here](https://github.com/iqb-berlin/testcenter-frontend/issues).
