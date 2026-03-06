# 0304DRL_HW1 - Grid Map Development & Policy Evaluation

This project is an implementation of a Grid Map reinforcement learning environment using Python (Flask) and HTML/JS. 

## Features
* **Grid Map Generation**: Allows users to specify dimensions (between 5x5 to 9x9) to generate a dynamic grid map.
* **Environment Setup**: Users can interactively set up the Start state (Green), End state (Red), and Obstacles (Grey) by clicking on the grid cells.
* **Policy Evaluation**: Performs policy evaluation using a uniform random stochastic policy. It visualizes:
  * **Value Matrix**: The state value $V(s)$ distribution for the grid.
  * **Policy Matrix**: A display of the random deterministic directional arrows.

## Setup and Execution
1. Ensure you have Python installed, then install the required dependencies:
   ```bash
   pip install flask
   ```
2. Run the application:
   ```bash
   python app.py
   ```
3. Open a web browser and navigate to `http://127.0.0.1:5000`
