# Dyte-Backend
### Coded by: [Ramesh Sachan](https://github.com/holps-7/Instagram-Spam-Bot/)

## Getting Started

### Prerequisites

You will need the following for running this script-<br/>
>1)nodejs<br/>
>2)npm<br/>
>3)moleculer-cli<br/>

## Deployment

>1. Clone the project<br/>
>2. Install moleculer-cli globally using npm 
```elm
npm i moleculer-cli -g
```
>3. open the project directory<br/>
>4. Install the dependencies<br/>
```elm
npm i
```

## Usage
Start the project with `npm run dev` command. 
After starting, open the http://localhost:3000/ URL in your browser. 
On the welcome page you can test the generated services via API Gateway and check the nodes & services.

In the terminal, try the following commands:
- `nodes` - List all connected nodes.
- `actions` - List all registered service actions.
- `call webhooks.register --targetURL localhost:3000/test7` - Call the `webhooks.register` action.
- `call webhooks.update --id uniqueID --newTargetURL localhost:3000/test8` - Call the `webhooks.update` action with the `uniqueID` and `newTargetURL` as parameters.
- `call webhooks.list` - List all the targetURLs in database (call the `webhooks.list` action).
- `call webhooks.trigger` - Call the `webhooks.trigger` action).


## Services
- **api**: API Gateway services
- **webhooks**: Service with `register`, `update`, `list` and `trigger` actions.

## NPM scripts
- `npm run dev`: Start development mode (load all services locally with hot-reload & REPL)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services)
- `npm run cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
- `npm run lint`: Run ESLint
- `npm run ci`: Run continuous test mode with watching
- `npm test`: Run tests & generate coverage report
- `npm run dc:up`: Start the stack with Docker Compose
- `npm run dc:down`: Stop the stack with Docker Compose


Note all the tasks along with the bonus tasks are completed.
