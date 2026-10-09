var QUIZ_TIME = 75;
var PENALTY = 10;
var FEEDBACK_MS = 800;
var HIGHSCORE_KEY = "savedHighscores";
var MAX_HIGHSCORES = 10;

var questions = [
    {
        question: "Which HTML element does JavaScript go inside?",
        choices: ["<javascript>", "<js>", "<script>", "<scripting>"],
        answer: 2
    },
    {
        question: "What is the correct syntax for referring to an external script called \"xxx.js\"?",
        choices: ["<script src=\"xxx.js\">", "<script name=\"xxx.js\">", "<script href=\"xxx.js\">", "<script value=\"xxx.js\">"],
        answer: 0
    },
    {
        question: "How do you create a function in JavaScript?",
        choices: ["function:myFunction()", "function = myFunction()", "function myFunction()", "myFunction():function"],
        answer: 2
    },
    {
        question: "How would you write \"Hello World\" in an alert box?",
        choices: ["alert(\"Hello World\")", "msgBox(\"Hello World\")", "alertBox = \"Hello World\"", "alertBox(\"Hello World\")"],
        answer: 0
    },
    {
        question: "Which method adds a new item to the end of an array?",
        choices: ["array.add()", "array.push()", "array.append()", "array.insert()"],
        answer: 1
    },
    {
        question: "Does an external JavaScript file need to contain the <script> tag?",
        choices: ["Yes", "No", "Sometimes", "Only on Wednesdays"],
        answer: 1
    },
    {
        question: "Where is the best place to put a <script> tag that doesn't use defer or async?",
        choices: ["The beginning of the <body>", "The end of the <body>", "Inside the <title>", "After the closing </html> tag"],
        answer: 1
    }
];

// Elements
var screens = {
    start: document.getElementById("start-screen"),
    question: document.getElementById("question-screen"),
    end: document.getElementById("end-screen"),
    highscores: document.getElementById("highscores-screen")
};
var timerEl = document.getElementById("timer");
var timeLeftEl = document.getElementById("time-left");
var progressEl = document.getElementById("progress");
var questionTextEl = document.getElementById("question-text");
var choicesEl = document.getElementById("choices");
var feedbackEl = document.getElementById("feedback");
var finalScoreEl = document.getElementById("final-score");
var scoreForm = document.getElementById("score-form");
var initialsInput = document.getElementById("initials");
var initialsError = document.getElementById("initials-error");
var highscoreList = document.getElementById("highscore-list");
var noScoresEl = document.getElementById("no-scores");

// State
var currentIndex = 0;
var timeLeft = QUIZ_TIME;
var correctCount = 0;
var timerId = null;
var answering = false;

function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
        screens[key].classList.toggle("hidden", key !== name);
    });
}

function renderTime() {
    timeLeftEl.textContent = timeLeft;
    timerEl.classList.toggle("low", timeLeft <= 10);
}

function startQuiz() {
    currentIndex = 0;
    correctCount = 0;
    timeLeft = QUIZ_TIME;
    answering = false;
    renderTime();
    showScreen("question");
    renderQuestion();

    clearInterval(timerId);
    timerId = setInterval(function () {
        timeLeft = Math.max(timeLeft - 1, 0);
        renderTime();
        if (timeLeft === 0) endQuiz();
    }, 1000);
}

function renderQuestion() {
    var q = questions[currentIndex];
    progressEl.textContent = "Question " + (currentIndex + 1) + " of " + questions.length;
    questionTextEl.textContent = q.question;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    choicesEl.innerHTML = "";

    q.choices.forEach(function (choice, index) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "choice";
        button.textContent = (index + 1) + ". " + choice;
        button.addEventListener("click", function () {
            checkAnswer(index, button);
        });
        choicesEl.appendChild(button);
    });
    choicesEl.querySelector("button").focus();
}

function checkAnswer(index, button) {
    if (answering) return;
    answering = true;

    var correct = index === questions[currentIndex].answer;
    if (correct) {
        correctCount++;
        feedbackEl.textContent = "Correct!";
        feedbackEl.className = "feedback correct";
        button.classList.add("correct");
    } else {
        timeLeft = Math.max(timeLeft - PENALTY, 0);
        renderTime();
        feedbackEl.textContent = "Wrong! −" + PENALTY + " seconds";
        feedbackEl.className = "feedback wrong";
        button.classList.add("wrong");
        choicesEl.children[questions[currentIndex].answer].classList.add("correct");
    }

    Array.prototype.forEach.call(choicesEl.children, function (choiceButton) {
        choiceButton.disabled = true;
    });

    setTimeout(function () {
        answering = false;
        currentIndex++;
        if (currentIndex >= questions.length || timeLeft === 0) {
            endQuiz();
        } else {
            renderQuestion();
        }
    }, FEEDBACK_MS);
}

function endQuiz() {
    clearInterval(timerId);
    timerId = null;
    finalScoreEl.textContent =
        "You answered " + correctCount + " of " + questions.length +
        " correctly. Your final score is " + timeLeft + ".";
    initialsInput.value = "";
    initialsError.textContent = "";
    showScreen("end");
    initialsInput.focus();
}

// ---------- high scores ----------

function loadHighscores() {
    try {
        var scores = JSON.parse(localStorage.getItem(HIGHSCORE_KEY));
        return Array.isArray(scores) ? scores : [];
    } catch (e) {
        return [];
    }
}

function renderHighscores() {
    var scores = loadHighscores();
    highscoreList.innerHTML = "";
    noScoresEl.classList.toggle("hidden", scores.length > 0);
    scores.forEach(function (entry) {
        var item = document.createElement("li");
        var name = document.createElement("span");
        name.textContent = entry.name;
        var score = document.createElement("span");
        score.className = "score";
        score.textContent = entry.score;
        item.appendChild(name);
        item.appendChild(score);
        highscoreList.appendChild(item);
    });
}

function showHighscores() {
    clearInterval(timerId);
    timerId = null;
    renderHighscores();
    showScreen("highscores");
}

scoreForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var initials = initialsInput.value.trim().toUpperCase();
    if (!initials) {
        initialsError.textContent = "Please enter your initials.";
        return;
    }

    var scores = loadHighscores();
    scores.push({ name: initials, score: timeLeft });
    scores.sort(function (a, b) { return b.score - a.score; });
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(scores.slice(0, MAX_HIGHSCORES)));
    showHighscores();
});

document.getElementById("start-btn").addEventListener("click", startQuiz);
document.getElementById("view-highscores").addEventListener("click", showHighscores);
document.getElementById("back-btn").addEventListener("click", function () {
    timeLeft = QUIZ_TIME;
    renderTime();
    showScreen("start");
});
document.getElementById("clear-btn").addEventListener("click", function () {
    localStorage.removeItem(HIGHSCORE_KEY);
    renderHighscores();
});

renderTime();
