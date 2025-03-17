# Quick Start
### React App
### Clone Repo & Start App
``` git clone https://github.com/jacksonlmakl/framework.git && cd framework && npm install && npm run dev ```

### CLI
### Clone Repo & Deploy Controller Based On Model & Deploy
``` git clone https://github.com/jacksonlmakl/framework.git && cd framework && sudo ./bin/deploy ```
### View Logs From Controller
``` sudo docker logs framework-scheduler ```
### Stop Controller
``` sudo docker stop framework-scheduler ```






# Framework Documentation

This framework facilitates the deployment and management of a controller based on a specified model. It leverages Docker to containerize the controller, ensuring consistent and isolated execution.

## Features

- **Automated Deployment**: Clone the repository and deploy the controller seamlessly using the provided deployment script.
- **Log Management**: Easily access and monitor controller logs to track operations and debug issues.
- **Controller Management**: Start, stop, and manage the controller's lifecycle with straightforward commands.

## Prerequisites

- **Git**: Ensure Git is installed to clone the repository. [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- **Docker**: Docker is required to build and run the controller within a container. [Install Docker](https://docs.docker.com/get-docker/)

## Installation and Deployment

1. **Clone the Repository**:

   Open your terminal and execute:

   ```bash
   git clone https://github.com/jacksonlmakl/framework.git
   ```

2. **Navigate to the Repository Directory**:

   ```bash
   cd framework
   ```

3. **Deploy the Controller**:

   Run the deployment script with superuser privileges:

   ```bash
   sudo ./bin/deploy
   ```

   This script will build and deploy the controller based on the configurations specified in controller.yaml.

## Managing the Controller

### View Logs:

To monitor the controller's logs:

```bash
sudo docker logs framework-scheduler
```

### Stop the Controller:

To stop the running controller:

```bash
sudo docker stop framework-scheduler
```

## Repository Structure

- **bin/**: Contains executable scripts, including the deployment script.
- **model/**: Houses model definitions utilized by the controller.
- **module/**: Includes various modules that extend or support the controller's functionality.
- **.gitignore**: Specifies intentionally untracked files to ignore.
- **README.md**: Provides an overview and instructions for the framework.
- **controller.yaml**: Configuration file detailing the controller's setup and parameters.

## Contributions

Contributions are welcome! Please fork the repository and submit a pull request with your proposed changes.

## License

This project is licensed under the MIT License.
