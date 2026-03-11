from flask import Flask, request, jsonify
import random
import os

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def home():
    return app.send_static_file('index.html')

def get_next_state(r, c, a, size, obstacles):
    nr, nc = r, c
    if a == 'U': nr -= 1
    elif a == 'D': nr += 1
    elif a == 'L': nc -= 1
    elif a == 'R': nc += 1

    if nr < 0 or nr >= size or nc < 0 or nc >= size or (nr, nc) in obstacles:
        nr, nc = r, c
    return (nr, nc)

@app.route('/evaluate', methods=['POST'])
def evaluate():
    data = request.json
    size = data.get('size')
    start = tuple(data.get('start')) if data.get('start') else None
    end = tuple(data.get('end')) if data.get('end') else None
    obstacles = [tuple(obs) for obs in data.get('obstacles', [])]
    gamma = float(data.get('gamma', 0.9))
    step_reward = float(data.get('stepReward', -1.0))
    algo = data.get('algo', 'PE')
    
    actions = ['U', 'D', 'L', 'R']
    policy = {}
    V = {f"{r},{c}": 0.0 for r in range(size) for c in range(size)}
    theta = 1e-4
    max_iters = 1000

    if algo == 'PE':
        # HW1-2: Policy Evaluation (Uniform Random Policy)
        # Init Random Deterministic Policy for visual only (since we evaluate average)
        for r in range(size):
            for c in range(size):
                if (r, c) == end or (r, c) in obstacles:
                    continue
                policy[f"{r},{c}"] = random.choice(actions)

        for _ in range(max_iters):
            delta = 0.0
            for r in range(size):
                for c in range(size):
                    if (r, c) == end or (r, c) in obstacles:
                        continue
                    
                    state_key = f"{r},{c}"
                    v = V[state_key]
                    
                    new_v = 0.0
                    for a in actions:
                        nr, nc = get_next_state(r, c, a, size, obstacles)
                        reward = 10.0 if (nr, nc) == end else step_reward
                        next_state_key = f"{nr},{nc}"
                        new_v += 0.25 * (reward + gamma * V[next_state_key])
                        
                    V[state_key] = new_v
                    delta = max(delta, abs(v - new_v))
            if delta < theta:
                break
        path = []

    else:
        # HW1-3: Value Iteration & Argmax Policy Extraction
        # 1. Value Iteration (Max Operator)
        for _ in range(max_iters):
            delta = 0.0
            for r in range(size):
                for c in range(size):
                    if (r, c) == end or (r, c) in obstacles:
                        continue
                    
                    state_key = f"{r},{c}"
                    v = V[state_key]
                    
                    max_v = float('-inf')
                    for a in actions:
                        nr, nc = get_next_state(r, c, a, size, obstacles)
                        reward = 10.0 if (nr, nc) == end else step_reward
                        next_state_key = f"{nr},{nc}"
                        
                        action_value = reward + gamma * V[next_state_key]
                        if action_value > max_v:
                            max_v = action_value
                            
                    V[state_key] = max_v
                    delta = max(delta, abs(v - max_v))
            if delta < theta:
                break

        # 2. Policy Extraction (Argmax)
        for r in range(size):
            for c in range(size):
                if (r, c) == end or (r, c) in obstacles:
                    continue
                
                state_key = f"{r},{c}"
                max_v = float('-inf')
                best_a = 'U'
                
                for a in actions:
                    nr, nc = get_next_state(r, c, a, size, obstacles)
                    reward = 10.0 if (nr, nc) == end else step_reward
                    next_state_key = f"{nr},{nc}"
                    
                    action_value = reward + gamma * V[next_state_key]
                    action_value = round(action_value, 4) # prevent floating point tie breaks
                    
                    if action_value > max_v:
                        max_v = action_value
                        best_a = a
                policy[state_key] = best_a

        # 3. Compute Optimal Path
        path = []
        if start:
            curr = start
            visited = set()
            while curr != end:
                key = f"{curr[0]},{curr[1]}"
                if key in visited:
                    break # loop detected
                visited.add(key)
                path.append(list(curr))
                
                a = policy.get(key)
                if not a:
                    break
                    
                curr = get_next_state(curr[0], curr[1], a, size, obstacles)

    # Format the values for clean display
    formatted_V = {k: round(v, 2) for k, v in V.items()}
    
    return jsonify({
        'policy': policy,
        'values': formatted_V,
        'path': path
    })

if __name__ == '__main__':
    app.run(debug=True)
