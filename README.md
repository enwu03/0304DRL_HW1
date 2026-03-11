# 0304DRL_HW1 - Grid Map Development & Policy Evaluation

![Grid Map Demo](demo.webp)

This project is an implementation of a Grid Map reinforcement learning environment. It consists of a frontend (HTML/CSS/JS) to handle dynamic UI rendering, and a Python Flask backend to execute synchronous/asynchronous logic for Value Iteration and Policy Evaluation over AJAX.

## Project Stages
* **HW1-1: Grid Map Generation**: 
  * Allows users to dynamically generate an N x N grid map (N=5 to 9). 
  * Interactive UI allows for setting a green start state (STEP 1), a red end state (STEP 2), and $N-2$ grey obstacles (STEP 3).
* **HW1-2: Policy Evaluation (PE)**: 
  * Calculates the state value matrix $V(s)$ by acting completely dynamically with a uniformly random probability (25% for U/D/L/R). Uses a discount factor and penalizing step-rewards.
* **HW1-3: Value Iteration & Optimization (VI)**: 
  * Evaluates the policy to find the most optimal path using the **Max** operator to choose actions mathematically guaranteeing the highest expected return. 
  * Then extracts the single best action (**Argmax**) and displays those navigation arrows dynamically rendered as SVG objects alongside an optimal path trace in Gold.
  * Allows the user to experiment with the Risk and Reward parameters smoothly via UI Sliders.

---

## Setup and Execution (Important!)

Because the RL logic executes via AJAX requests connecting to a backend server, **this project CANNOT be run purely statically on GitHub Pages. You must run it locally using Python.**

1. Ensure you have Python installed, then install the required `Flask` dependency:
   ```bash
   pip install flask
   ```

2. Clone the repository and navigate into the folder:
   ```bash
   git clone https://github.com/enwu03/0304DRL_HW1.git
   cd 0304DRL_HW1
   ```

3. Run the backend server application:
   ```bash
   python app.py
   ```
   *(You should see an output saying it is running on `http://127.0.0.1:5000`)*

4. Open any modern web browser and navigate directly to:
   **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

5. Try interacting with the map, generating a layout, adjusting the Discount/Reward sliders, and clicking the calculation buttons to observe AJAX updates from the server!
