var canvas = document.getElementById("canvas");
var actionSpan = document.getElementById("actionSpan");
var episodesSpan = document.getElementById("episodesSpan");
var expSpan = document.getElementById("expSpan");
var context = canvas.getContext("2d");

var w = 0;
var h = 0;

var numCols = 4;
var numRows = 4;

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
resizeCanvas(numCols * 100, numRows * 100);

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

        this.q_table = new Array(numCols * numRows);
        for (let i = 0; i < numCols * numRows; i++) {
            this.q_table[i] = new Array(this.actions.length);
            for (let j = 0; j < 4; j++) {
                this.q_table[i][j] = 0;
            }
        }
        this.playerStart = new Vector(-(numCols - 1) * w / (numCols * 2), (numRows - 1) * h / (numRows * 2));
        this.playerPos = new Vector(-(numCols - 1) * w / (numCols * 2), (numRows - 1) * h / (numRows * 2));
        this.goal = new Vector((numCols - 1) * w / (numCols * 2), -(numRows - 1) * h / (numRows * 2))
        this.end = new Vector((numCols - 1) * w / (numCols * 2), -(numRows - 3) * h / (numRows * 2))
        this.episode = 0;

        //Blocks
        this.blocks = [];
        while (this.blocks.length < Math.max(numCols, numRows) - 1) {
            let randX = -w / 2 + Math.floor(Math.random() * numCols) * w / numCols;
            let randY = -h / 2 + Math.floor(Math.random() * numRows) * h / numRows;

            if ((randX + w / (2 * numCols) != this.playerStart.x || randY + h / (2 * numRows) != this.playerStart.y) &&
                (randX + w / (2 * numCols) != this.goal.x || randY + h / (2 * numRows) != this.goal.y) &&
                (randX + w / (2 * numCols) != this.end.x || randY + h / (2 * numRows) != this.end.y)) {
                let newValues = true;
                for (let i = 0; i < this.blocks.length; i++) {
                    if (randX == this.blocks[i].x && randY == this.blocks[i].y) {
                        newValues = false;
                        break;
                    }
                }
                if (newValues)
                    this.blocks.push(new Vector(randX, randY));
            }

        }

        this.reset();
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
        this.steps++;
        if (this.steps > this.max_steps_per_episode) {
            this.episode++;
            this.exploration_rate = this.min_exploration_rate + (this.max_exploration_rate - this.min_exploration_rate) * Math.exp(-this.exploration_decay_rate * this.episode);
            expSpan.innerHTML = "";
            expSpan.insertAdjacentHTML('beforeend', Math.floor(this.exploration_rate*getClosestBoardSize())/getClosestBoardSize());
            this.reset();
        }

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
        for (let i = 1; i < numCols; i++) {
            context.moveTo(-w / 2 + i * w / numCols, -h / 2);
            context.lineTo(-w / 2 + i * w / numCols, h / 2);

        }

        //Horizontal lines
        for (let i = 1; i < numRows; i++) {
            context.moveTo(-w / 2, -h / 2 + i * h / numRows);
            context.lineTo(w / 2, -h / 2 + i * h / numRows);

        }

        //Diagonal lines
        for (let j = 0; j < numRows; j++) {
            for (let i = 0; i < numCols; i++) {
                context.moveTo(-w / 2 + i * w / numCols, -h / 2 + j * h / numRows);
                context.lineTo(-w / 2 + (i + 1) * w / numCols, -h / 2 + (j + 1) * h / numRows);

                context.moveTo(-w / 2 + i * w / numCols, -h / 2 + (j + 1) * h / numRows);
                context.lineTo(-w / 2 + (i + 1) * w / numCols, -h / 2 + j * h / numRows);
            }
        }

        context.lineWidth = 2 * canvasFactor;
        context.strokeStyle = 'rgba(255,255,255,0.7)';
        context.stroke();

        context.beginPath();
        context.rect(this.goal.x - w / (numCols * 2), this.goal.y - h / (numRows * 2), w / numCols, h / numRows)
        context.fillStyle = 'rgba(65,190,70,1)'
        context.fill();

        context.font = 30 * canvasFactor + "px Arial";
        context.fillStyle = "green";
        context.fillText(this.counter.numGoal, this.goal.x - w / (numCols * 4), this.goal.y + h / (numRows * 16));

        context.beginPath();
        context.rect(this.end.x - w / (numCols * 2), this.end.y - h / (numRows * 2), w / numCols, h / numRows)
        context.fillStyle = 'rgba(230,73,25,1)';
        context.fill();

        context.font = 30 * canvasFactor + "px Arial";
        context.fillStyle = 'rgba(141,2,31,1)';
        context.fillText(this.counter.numEnd, this.end.x - w / (numCols * 4), this.end.y + h / (numRows * 16));

        for (let block of this.blocks) {
            context.beginPath();
            context.rect(block.x, block.y, w / numCols, h / numRows)
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
            this.episode++;
            return null;
        }
        switch (dir) {
            case "up":
                newY -= h / numRows;
                break;
            case "down":
                newY += h / numRows;
                break;
            case "left":
                newX -= w / numCols;
                break;
            case "right":
                newX += w / numCols;
                break;
            default:
                break;
        }
        if (newX > -w / 2 && newX < w / 2 && newY < h / 2 && newY > -h / 2) {
            let onBlock = false;
            for (let block of this.blocks) {
                if (newX == block.x + w / (2 * numCols) && newY == block.y + h / (2 * numRows)) {
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
        return ((y + (numRows - 1) * h / (2 * numRows)) / (h / numRows) * numCols + (x + (numCols - 1) * w / (numCols * 2)) / (w / numCols))
    }

    drawQValues() {
        let wCounter = 0;
        let hCounter = 0;
        for (let i = 0; i < numRows * numCols; i++) {
            let widthOffset = wCounter * w / numCols;
            let heightOffset = hCounter * h / numRows;
            wCounter++;
            if ((i + 1) % numCols == 0) {
                wCounter = 0
                hCounter++;
            }

            let up = this.q_table[i][0];
            let right = this.q_table[i][1];
            let down = this.q_table[i][2];
            let left = this.q_table[i][3];

            //Up
            context.beginPath();
            context.moveTo(-(numCols - 1) * w / (numCols * 2) + widthOffset, -(numRows - 1) * h / (numRows * 2) + heightOffset);
            context.lineTo(-(numCols - 1) * w / (numCols * 2) + widthOffset + w / (numCols * 2), -(numRows - 1) * h / (numRows * 2) + heightOffset - h / (numRows * 2));
            context.lineTo(-(numCols - 1) * w / (numCols * 2) + widthOffset - w / (numCols * 2), -(numRows - 1) * h / (numRows * 2) + heightOffset - h / (numRows * 2));
            if (up > 0) {
                context.fillStyle = "rgba(65,190,70, " + Math.abs(up) + ")";
            } else
                context.fillStyle = "rgba(230,73,25, " + Math.abs(up) + ")";
            context.fill();

            //Right
            context.beginPath();
            context.moveTo(-(numCols - 1) * w / (numCols * 2) + widthOffset, -(numRows - 1) * h / (numRows * 2) + heightOffset);
            context.lineTo(-(numCols - 1) * w / (numCols * 2) + widthOffset + w / (numCols * 2), -(numRows - 1) * h / (numRows * 2) + heightOffset - h / (numRows * 2));
            context.lineTo(-(numCols - 1) * w / (numCols * 2) + widthOffset + w / (numCols * 2), -(numRows - 1) * h / (numRows * 2) + heightOffset + h / (numRows * 2));
            if (right > 0) {
                context.fillStyle = "rgba(65,190,70, " + Math.abs(right) + ")";
            } else
                context.fillStyle = "rgba(230,73,25, " + Math.abs(right) + ")";
            context.fill();

            //Down
            context.beginPath();
            context.moveTo(-(numCols - 1) * w / (numCols * 2) + widthOffset, -(numRows - 1) * h / (numRows * 2) + heightOffset);
            context.lineTo(-(numCols - 1) * w / (numCols * 2) + widthOffset + w / (numCols * 2), -(numRows - 1) * h / (numRows * 2) + heightOffset + h / (numRows * 2));
            context.lineTo(-(numCols - 1) * w / (numCols * 2) + widthOffset - w / (numCols * 2), -(numRows - 1) * h / (numRows * 2) + heightOffset + h / (numRows * 2));
            if (down > 0) {
                context.fillStyle = "rgba(65,190,70, " + Math.abs(down) + ")";
            } else
                context.fillStyle = "rgba(230,73,25, " + Math.abs(down) + ")";
            context.fill();

            //Left
            context.beginPath();
            context.moveTo(-(numCols - 1) * w / (numCols * 2) + widthOffset, -(numRows - 1) * h / (numRows * 2) + heightOffset);
            context.lineTo(-(numCols - 1) * w / (numCols * 2) + widthOffset - w / (numCols * 2), -(numRows - 1) * h / (numRows * 2) + heightOffset + h / (numRows * 2));
            context.lineTo(-(numCols - 1) * w / (numCols * 2) + widthOffset - w / (numCols * 2), -(numRows - 1) * h / (numRows * 2) + heightOffset - h / (numRows * 2));
            if (left > 0) {
                context.fillStyle = "rgba(65,190,70, " + Math.abs(left) + ")";
            } else
                context.fillStyle = "rgba(230,73,25, " + Math.abs(left) + ")";
            context.fill();

            this.drawText(up, -(numCols - 1) * w / (numCols * 2) + widthOffset, -(numRows - 1) * h / (numRows * 2) + heightOffset - h / (3 * numRows))
            this.drawText(right, -(numCols - 1) * w / (numCols * 2) + widthOffset + w / (4 * numCols), -(numRows - 1) * h / (numRows * 2) + heightOffset)
            this.drawText(down, -(numCols - 1) * w / (numCols * 2) + widthOffset, -(numRows - 1) * h / (numRows * 2) + heightOffset + h / (3 * numRows))
            this.drawText(left, -(numCols - 1) * w / (numCols * 2) + widthOffset - w / (3 * numCols), -(numRows - 1) * h / (numRows * 2) + heightOffset)

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

function getClosestBoardSize() {
    return Math.pow(10, Math.floor(Math.log(numRows * numCols)));
}

let closestBoardSize = getClosestBoardSize();
let options = {
    num_eps: 100,
    max_steps_per_episode: numRows * numCols,
    learning_rate: 0.1,
    discount_rate: 0.99,
    exploration_rate: 1,
    max_exploration_rate: 1,
    min_exploration_rate: 0.01,
    exploration_decay_rate: 1 / closestBoardSize
}

let q = new QLearning(options)

let speed = 1;
let requestId;

function update() {
    for (let i = 0; i < speed; i++)
        q.step();
    q.setup();
    episodesSpan.innerHTML = "";
    episodesSpan.insertAdjacentHTML('beforeend', q.episode);
    requestId = window.requestAnimationFrame(update);
}

function stop() {
    window.cancelAnimationFrame(requestId);
}

function start() {
    update();
}

function reset() {
    options.exploration_decay_rate = 1 / getClosestBoardSize();
    q = new QLearning(options);
    console.log(q.exploration_decay_rate)
}

function step() {
    q.step();
}

var docRows = document.getElementById("rows")
var docColumns = document.getElementById("columns")

function changeRow(sign) {
    if (sign < 0 && numRows > 0)
        numRows -= 1;
    else
        numRows += 1;
    docRows.innerHTML = "";
    docRows.insertAdjacentHTML('beforeend', numRows);
    resizeCanvas(numCols * 100, numRows * 100);
    reset();
}

function changeColumn(sign) {
    if (sign < 0 && numCols > 0)
        numCols -= 1;
    else
        numCols += 1;
    docColumns.innerHTML = "";
    docColumns.insertAdjacentHTML('beforeend', numCols);
    resizeCanvas(numCols * 100, numRows * 100);
    reset();
}

var docSpeed = document.getElementById("speed");
var docSpeedInput = document.getElementById("speedInput");
var rangePercent = docSpeedInput.value;

function changeSpeed() {
    rangePercent = docSpeedInput.value;
    docSpeed.innerHTML = "";
    docSpeed.insertAdjacentHTML('beforeend', rangePercent);
    docSpeedInput.style.filter = 'hue-rotate(-' + rangePercent + 'deg)';
    speed = rangePercent;
};
docSpeedInput.addEventListener("input", changeSpeed);
