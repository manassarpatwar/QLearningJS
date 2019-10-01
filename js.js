var canvas = document.getElementById("canvas");
var actionSpan = document.getElementById("actionSpan");
var context = canvas.getContext("2d");
var w = 0;
var h = 0;

let canvasFactor = 2;

function resizeCanvas(width, height) {
    canvas.width = width * canvasFactor;
    canvas.height = height * canvasFactor;
    w = canvas.width;
    h = canvas.height;
    canvas.style.width = w / canvasFactor + "px";
    canvas.style.height = h / canvasFactor + "px";
    context.translate(w / 2, h / 2);
};
resizeCanvas(400, 400);

function Vector(x, y) {
    this.x = x;
    this.y = y;
}

function clearCanvas() {
    context.clearRect(-w, -h, 2 * w, 2 * h);
}

class QLearning {
    constructor(options) {
        this.num_eps = options.num_eps;
        this.max_steps_per_episode = options.max_steps_per_episode;
        this.learning_rate = options.learning_rate;
        this.discount_rate = options.discount_rate;
        this.exploration_rate = options.exploration_rate;
        this.max_exploration_rate = options.max_exploration_rate;
        this.min_exploration_rate = options.min_exploration_rate;
        this.exploration_decay_rate = options.exploration_decay_rate;

        this.actions = ["up", "right", "down", "left"];

        this.counter = {
            numGoal: 0,
            numEnd: 0
        };

        this.blocks = [new Vector(-w / 4, 0), new Vector(-w / 4, -h / 4)];
        this.q_table = new Array(16);
        for (let i = 0; i < 16; i++) {
            this.q_table[i] = new Array(4);
            for (let j = 0; j < 4; j++) {
                this.q_table[i][j] = 0;
            }
        }
        this.playerStart = new Vector(-3 * w / 8, 3 * h / 8);
        this.playerPos = new Vector(-3 * w / 8, 3 * h / 8);
        this.goal = new Vector(3 * w / 8, -3 * h / 8)
        this.end = new Vector(3 * w / 8, -h / 8)
        this.episode = 0;
        this.reset();
    }

    learn() {
        for (let i = 0; i < this.num_eps; i++) {
            let state = this.reset();
            for (let j = 0; j < this.max_steps_per_episode; j++) {
                this.step();
                if (this.done)
                    break;
            }
            this.exploration_rate = this.min_exploration_rate + (this.max_exploration_rate - this.min_exploration_rate) * Math.exp(-this.exploration_decay_rate * i);
        }
    }

    step() {
        let exploration_rate_threshold = Math.random();
        let action;

        if (exploration_rate_threshold > this.exploration_rate)
            action = this.q_table[this.state].reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
        else
            action = Math.floor(Math.random() * this.actions.length);
        //        console.log(this.actions[action])
        actionSpan.innerHTML = "";
        actionSpan.insertAdjacentHTML('beforeend', this.actions[action]);
        let newEnv = this.move(this.actions[action]);
        if (newEnv) {
            let newState = newEnv.newState;
            let reward = newEnv.reward;

            this.q_table[this.state][action] = this.q_table[this.state][action] * (1 - this.learning_rate) +
                this.learning_rate * (reward + this.discount_rate * Math.max.apply(null, this.q_table[newState]))

            this.q_table[this.state][action] = Math.floor(this.q_table[this.state][action] * 100) / 100
            this.state = newState;
        }
        this.setup();
        this.steps++;
        if (this.steps > this.max_steps_per_episode)
            this.reset();

    }

    reset() {
        this.done = false;
        this.steps = 0;
        this.playerPos.x = this.playerStart.x;
        this.playerPos.y = this.playerStart.y;
        this.setup();
        this.state = this.getState(this.playerPos.x, this.playerPos.y);
    }

    setup() {
        clearCanvas();
        this.drawQValues();
        this.drawEnvironment();
        this.drawPlayer(this.playerPos.x, this.playerPos.y)
    }

    drawEnvironment() {
        context.beginPath();
        //Vertical lines
        for (let i = 0; i < 5; i++) {
            context.moveTo(-w / 2 + i * w / 4, -h / 2);
            context.lineTo(-w / 2 + i * w / 4, h / 2);

        }

        //Horizontal lines
        for (let i = 0; i < 4; i++) {
            context.moveTo(-w / 2, -h / 2 + i * h / 4);
            context.lineTo(w / 2, -h / 2 + i * h / 4);

        }

        //Diagonal lines
        for (let i = 0; i < 7; i++) {
            context.moveTo(-w / 2, h / 4 - h / 4 * i);
            context.lineTo(-w / 4 + w / 4 * i, h / 2);

        }

        for (let i = 0; i < 7; i++) {
            context.moveTo(w / 2, h / 4 - h / 4 * i);
            context.lineTo(w / 4 - w / 4 * i, h / 2);

        }

        context.lineWidth = 2 * canvasFactor;
        context.strokeStyle = 'rgba(255,255,255,0.7)';
        context.stroke();

        context.beginPath();
        context.rect(this.goal.x - w / 8, this.goal.y - h / 8, w / 4, h / 4)
        context.fillStyle = 'rgba(65,190,70,1)'
        context.fill();

        context.font = 30 * canvasFactor + "px Arial";
        context.fillStyle = "green";
        context.fillText(this.counter.numGoal, this.goal.x - w / 16, this.goal.y + h / 64);

        context.beginPath();
        context.rect(this.end.x - w / 8, this.end.y - h / 8, w / 4, h / 4)
        context.fillStyle = 'rgba(230,73,25,1)';
        context.fill();

        context.font = 30 * canvasFactor + "px Arial";
        context.fillStyle = 'rgba(141,2,31,1)';
        context.fillText(this.counter.numEnd, this.end.x - w / 16, this.end.y + h / 64);

        for (let block of this.blocks) {
            context.beginPath();
            context.rect(block.x, block.y, w / 4, h / 4)
            context.fillStyle = "black";
            context.fill();
        }

    }

    move(dir) {
        let newX = this.playerPos.x;
        let newY = this.playerPos.y;
        let reward = -0.04;
        if (this.done) {
            this.reset();
            this.exploration_rate = this.min_exploration_rate + (this.max_exploration_rate - this.min_exploration_rate) * Math.exp(-this.exploration_decay_rate * this.episode);
            this.episode++;
            return null;
        }
        switch (dir) {
            case "up":
                newY -= h / 4;
                break;
            case "down":
                newY += h / 4;
                break;
            case "left":
                newX -= w / 4;
                break;
            case "right":
                newX += w / 4;
                break;
            default:
                break;
        }
        if (newX > -w / 2 && newX < w / 2 && newY < h / 2 && newY > -h / 2) {
            let onBlock = false;
            for (let block of this.blocks) {
                if (newX == block.x + w / 8 && newY == block.y + h / 8) {
                    onBlock = true;
                    break;
                }
            }
            if (!onBlock) {
                this.playerPos.x = newX;
                this.playerPos.y = newY;
            }

        }
        let newState = this.getState(this.playerPos.x, this.playerPos.y);
        switch (newState) {
            case this.getState(this.goal.x, this.goal.y):
                console.log("goal")
                reward += 1;
                this.counter.numGoal++;
                this.done = true;
                break;
            case this.getState(this.end.x, this.end.y):
                console.log("end")
                reward -= 1;
                this.counter.numEnd++;
                this.done = true;
                break;
        }

        //        console.log(newState + " " + reward + " " + done);

        this.setup()
        return {
            newState: newState,
            reward: reward
        };
    }

    getState(x, y) {
        return ((y + 3 * h / 8) / (h / 4) * 4 + (x + 3 * w / 8) / (w / 4))
    }

    drawQValues() {
        let wCounter = 0;
        let hCounter = 0;
        for (let i = 0; i < 16; i++) {
            let widthOffset = wCounter * w / 4;
            let heightOffset = hCounter * h / 4;
            wCounter++;
            if ((i + 1) % 4 == 0) {
                wCounter = 0
                hCounter++;
            }

            let up = this.q_table[i][0];
            let right = this.q_table[i][1];
            let down = this.q_table[i][2];
            let left = this.q_table[i][3];

            //Up
            context.beginPath();
            context.moveTo(-3 * w / 8 + widthOffset, -3 * h / 8 + heightOffset);
            context.lineTo(-3 * w / 8 + widthOffset + w / 8, -3 * h / 8 + heightOffset - h / 8);
            context.lineTo(-3 * w / 8 + widthOffset - w / 8, -3 * h / 8 + heightOffset - h / 8);
            if (up > 0) {
                context.fillStyle = "rgba(65,190,70, " + Math.abs(up) + ")";
            } else
                context.fillStyle = "rgba(230,73,25, " + Math.abs(up) + ")";
            context.fill();

            //Right
            context.beginPath();
            context.moveTo(-3 * w / 8 + widthOffset, -3 * h / 8 + heightOffset);
            context.lineTo(-3 * w / 8 + widthOffset + w / 8, -3 * h / 8 + heightOffset - h / 8);
            context.lineTo(-3 * w / 8 + widthOffset + w / 8, -3 * h / 8 + heightOffset + h / 8);
            if (right > 0) {
                context.fillStyle = "rgba(65,190,70, " + Math.abs(right) + ")";
            } else
                context.fillStyle = "rgba(230,73,25, " + Math.abs(right) + ")";
            context.fill();

            //Down
            context.beginPath();
            context.moveTo(-3 * w / 8 + widthOffset, -3 * h / 8 + heightOffset);
            context.lineTo(-3 * w / 8 + widthOffset + w / 8, -3 * h / 8 + heightOffset + h / 8);
            context.lineTo(-3 * w / 8 + widthOffset - w / 8, -3 * h / 8 + heightOffset + h / 8);
            if (down > 0) {
                context.fillStyle = "rgba(65,190,70, " + Math.abs(down) + ")";
            } else
                context.fillStyle = "rgba(230,73,25, " + Math.abs(down) + ")";
            context.fill();

            //Left
            context.beginPath();
            context.moveTo(-3 * w / 8 + widthOffset, -3 * h / 8 + heightOffset);
            context.lineTo(-3 * w / 8 + widthOffset - w / 8, -3 * h / 8 + heightOffset + h / 8);
            context.lineTo(-3 * w / 8 + widthOffset - w / 8, -3 * h / 8 + heightOffset - h / 8);
            if (left > 0) {
                context.fillStyle = "rgba(65,190,70, " + Math.abs(left) + ")";
            } else
                context.fillStyle = "rgba(230,73,25, " + Math.abs(left) + ")";
            context.fill();

            this.drawText(up, -3 * w / 8 + widthOffset - 3 * w / 128, -3 * h / 8 + heightOffset - h / 16 - 3 * h / 256)
            this.drawText(right, -3 * w / 8 + widthOffset + w / 16, -3 * h / 8 + heightOffset)
            this.drawText(down, -3 * w / 8 + widthOffset - 3 * w / 128, -3 * h / 8 + heightOffset + h / 16 + 3 * h / 128)
            this.drawText(left, -3 * w / 8 + widthOffset - w / 16 - 3 * w / 64, -3 * h / 8 + heightOffset)

        }
    }

    drawText(data, x, y) {
        context.font = 10 * canvasFactor + "px Arial";
        context.fillStyle = "black";
        context.fillText(data, x, y);
    }

    drawPlayer(x, y) {
        context.beginPath()
        context.arc(x, y, 15 * canvasFactor, 0, Math.PI * 2);
        context.fillStyle = "rgba(0,127,255,1)";
        context.fill();
    }

}

let options = {
    num_eps: 100,
    max_steps_per_episode: 10,
    learning_rate: 0.1,
    discount_rate: 0.99,
    exploration_rate: 1,
    max_exploration_rate: 1,
    min_exploration_rate: 0.01,
    exploration_decay_rate: 0.01
}

let q = new QLearning(options)

let speed = 1;
let requestId;

function update() {
    q.step();
    requestId = window.requestAnimationFrame(update);
}

function stop() {
    window.cancelAnimationFrame(requestId);
}

function start() {
    update();
}

function step() {
    q.step();
}
