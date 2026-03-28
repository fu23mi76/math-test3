let currentQuizData = []; 
let userAnswers = []; 

// 配列をシャッフルする関数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ページ読み込み時の処理
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const unitKey = urlParams.get('unit');

    if (unitKey && questionBank[unitKey]) {
        const unitData = questionBank[unitKey];
        document.getElementById('unit-title').innerText = unitData.title + " テスト";
        
        // 問題をシャッフルして最大10問抽出
        const allQuestions = [...unitData.questions];
        shuffleArray(allQuestions);
        const selectedQuestions = allQuestions.slice(0, 10);

        // 各問題の「選択肢」をシャッフルし、正誤判定フラグを持たせた新しい配列を作る
        currentQuizData = selectedQuestions.map(q => {
            let choiceObjects = q.choices.map((choiceText, index) => {
                return { text: choiceText, isCorrect: (index === q.a) };
            });
            shuffleArray(choiceObjects);
            
            return {
                q: q.q,
                shuffledChoices: choiceObjects,
                explanation: q.explanation
            };
        });

        // ユーザー解答配列を初期化
        userAnswers = new Array(currentQuizData.length).fill(-1);

        renderQuestions();
    } else {
        document.getElementById('unit-title').innerText = "単元が見つかりません";
    }
};

// 問題の描画
function renderQuestions() {
    const container = document.getElementById('quiz-container');
    let html = "";

    currentQuizData.forEach((item, qIndex) => {
        html += `
            <div class="question-block">
                <p class="question-text"><strong>問${qIndex + 1}.</strong> ${item.q}</p>
                <div class="choice-grid" id="choices-${qIndex}">
        `;

        // シャッフル済みの選択肢を描画
        item.shuffledChoices.forEach((choiceObj, cIndex) => {
            html += `
                <button type="button" class="choice-btn" id="q${qIndex}-c${cIndex}" onclick="selectAnswer(${qIndex}, ${cIndex})">
                    ${choiceObj.text}
                </button>
            `;
        });

        html += `
                </div>
            </div>
            <hr>
        `;
    });

    container.innerHTML = html;
    
    // 修正箇所：問題が1件以上ある場合のみ「採点する」ボタンを表示
    if (currentQuizData.length > 0) {
        document.getElementById('submit-btn').style.display = "block";
    }

    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

// 選択時の処理
function selectAnswer(qIndex, cIndex) {
    const choicesContainer = document.getElementById(`choices-${qIndex}`);
    const buttons = choicesContainer.getElementsByClassName('choice-btn');
    for (let btn of buttons) {
        btn.classList.remove('selected');
    }

    const selectedButton = document.getElementById(`q${qIndex}-c${cIndex}`);
    selectedButton.classList.add('selected');

    userAnswers[qIndex] = cIndex;
}

// 採点処理と解説表示
function calculateScore() {
    if (userAnswers.includes(-1)) {
        alert("まだ解答していない問題があります。");
        return;
    }

    let score = 0;
    let correctHTML = "<div class='result-section'><h3>⭕️ 正解した問題</h3>";
    let incorrectHTML = "<div class='result-section'><h3>❌ 間違えた問題</h3>";

    currentQuizData.forEach((item, qIndex) => {
        const chosenIndex = userAnswers[qIndex];
        const isCorrect = item.shuffledChoices[chosenIndex].isCorrect;
        
        const userAnswerText = item.shuffledChoices[chosenIndex].text;
        const correctAnswerText = item.shuffledChoices.find(c => c.isCorrect).text;

        const explanationBlock = `
            <details class="explanation-details">
                <summary>解説を読む</summary>
                <div class="explanation-content">
                    ${item.explanation ? item.explanation : "解説が登録されていません。"}
                </div>
            </details>
        `;

        const resultItemHTML = `
            <div class="result-item ${isCorrect ? 'correct-item' : 'incorrect-item'}">
                <p><strong>問${qIndex + 1}.</strong> ${item.q}</p>
                <p class="answer-compare">
                    あなたの解答: ${userAnswerText}
                    ${!isCorrect ? ` <br><span class="correct-text">正答: ${correctAnswerText}</span>` : ''}
                </p>
                ${explanationBlock}
            </div>
        `;

        if (isCorrect) {
            score++;
            correctHTML += resultItemHTML;
        } else {
            incorrectHTML += resultItemHTML;
        }
    });

    correctHTML += "</div>";
    incorrectHTML += "</div>";

    if (score === 0) correctHTML = "<div class='result-section'><h3>⭕️ 正解した問題</h3><p>ありませんでした。解説を読んで復習しましょう。</p></div>";
    if (score === currentQuizData.length) incorrectHTML = "<div class='result-section'><h3>❌ 間違えた問題</h3><p>ありませんでした。素晴らしいです！</p></div>";

    const resultArea = document.getElementById('result-area');
    resultArea.innerHTML = `
        <h2>採点結果: ${score} / ${currentQuizData.length} 問 正解</h2>
        ${incorrectHTML}
        ${correctHTML}
    `;

    document.getElementById('submit-btn').style.display = "none";

    if (window.MathJax) {
        MathJax.typesetPromise([resultArea]);
    }
}
