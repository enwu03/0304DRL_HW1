from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def home():
    grid_size = None
    if request.method == 'POST':
        try:
            size_input = int(request.form.get('grid_size', 0))
            if 5 <= size_input <= 9:
                grid_size = size_input
        except ValueError:
            pass
    return render_template('index.html', grid_size=grid_size)

@app.route('/evaluate', methods=['POST'])
def evaluate():
    data = request.json
    size = data.get('size')
    start = tuple(data.get('start')) if data.get('start') else None
    end = tuple(data.get('end')) if data.get('end') else None
    obstacles = [tuple(obs) for obs in data.get('obstacles', [])]
    
    actions = ['U', 'D', 'L', 'R']
    policy = {}
    
    # 1. Generate random deterministic policy
    for r in range(size):
        for c in range(size):
            if (r, c) == end or (r, c) in obstacles:
                continue
            policy[f"{r},{c}"] = random.choice(actions)
            
    # 2. Policy Evaluation (Evaluating a uniform random policy for the Value Matrix)
    V = {f"{r},{c}": 0.0 for r in range(size) for c in range(size)}
    gamma = 0.9
    theta = 1e-4
    
    max_iters = 1000
    for _ in range(max_iters):
        delta = 0.0
        for r in range(size):
            for c in range(size):
                if (r, c) == end or (r, c) in obstacles:
                    continue
                    
                state_key = f"{r},{c}"
                v = V[state_key]
                
                # Evaluate uniform random policy (0.25 probability for each action)
                new_v = 0.0
                for a in ['U', 'D', 'L', 'R']:
                    nr, nc = r, c
                    if a == 'U': nr -= 1
                    elif a == 'D': nr += 1
                    elif a == 'L': nc -= 1
                    elif a == 'R': nc += 1
                    
                    # Boundary and obstacle check
                    if nr < 0 or nr >= size or nc < 0 or nc >= size or (nr, nc) in obstacles:
                        nr, nc = r, c
                        
                    next_state_key = f"{nr},{nc}"
                    
                    # Reward function exactly like standard GridWorld: Normal step = -1
                    if (nr, nc) == end:
                        reward = 10.0
                    else:
                        reward = -1.0
                        
                    new_v += 0.25 * (reward + gamma * V[next_state_key])
                    
                V[state_key] = new_v
                delta = max(delta, abs(v - new_v))
                
        if delta < theta:
            break
            
    # Format the values for clean display
    formatted_V = {k: round(v, 2) for k, v in V.items()}
    
    return jsonify({
        'policy': policy,
        'values': formatted_V
    })

if __name__ == '__main__':
    app.run(debug=True)
