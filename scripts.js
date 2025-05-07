document.addEventListener('DOMContentLoaded', () => {
    const questionImageElement = document.getElementById('questionImage');
    const questionLabelElement = document.getElementById('questionLabel');
    const answerInputElement = document.getElementById('answerInput');
    const submitButton = document.getElementById('submitButton');
    const resultAreaElement = document.getElementById('resultArea');
    const progressElement = document.getElementById('progress');

    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];

    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            questions = await response.json();
            if (questions.length > 0) {
                displayQuestion();
            } else {
                questionLabelElement.textContent = '問題データがありません。';
                submitButton.style.display = 'none';
                answerInputElement.style.display = 'none';
            }
        } catch (error) {
            console.error('問題の読み込みに失敗しました:', error);
            questionLabelElement.textContent = '問題の読み込みに失敗しました。';
            submitButton.style.display = 'none';
            answerInputElement.style.display = 'none';
        }
    }

    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            const question = questions[currentQuestionIndex];
            questionImageElement.src = question.page_image;
            questionImageElement.alt = `問題画像 ${question.question_label}`;
            questionLabelElement.textContent = `${question.question_label}`;
            answerInputElement.value = ''; // 前の解答をクリア
            answerInputElement.focus();
            submitButton.textContent = '解答する';
            progressElement.textContent = `問題 ${currentQuestionIndex + 1} / ${questions.length}`;
            
            // resultAreaをクリア
            resultAreaElement.innerHTML = '';
            // 表示要素を再表示
            questionImageElement.style.display = 'block';
            questionLabelElement.style.display = 'block';
            answerInputElement.style.display = 'block';
            submitButton.style.display = 'block';
            progressElement.style.display = 'block';

        } else {
            showResults();
        }
    }

    function handleSubmit() {
        if (currentQuestionIndex < questions.length) {
            const userAnswer = answerInputElement.value.trim();
            // ユーザーの解答を記録 (配列の長さを調整)
            if (userAnswers.length <= currentQuestionIndex) {
                userAnswers.push(userAnswer);
            } else {
                userAnswers[currentQuestionIndex] = userAnswer;
            }
            
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                displayQuestion();
            } else {
                showResults();
            }
        }
    }

    function showResults() {
        questionImageElement.style.display = 'none';
        questionLabelElement.style.display = 'none';
        answerInputElement.style.display = 'none';
        submitButton.style.display = 'none';
        progressElement.style.display = 'none';

        let correctCount = 0;
        let resultsHTML = '<h2>テスト結果</h2><ul>';

        questions.forEach((question, index) => {
            const userAnswer = userAnswers[index] || ""; // 未解答の場合
            
            // 正誤判定: correct_answers のいずれかに一致すればOK (カタカナ・ひらがな、全角・半角の違いも一部吸収)
            const normalizedUserAnswer = normalizeAnswer(userAnswer);
            const isCorrect = question.correct_answers.some(ans => normalizeAnswer(ans) === normalizedUserAnswer);

            if (isCorrect) {
                correctCount++;
            }
            resultsHTML += `<li>
                問題 ${question.question_label}:<br>
                あなたの解答「${userAnswer || "未解答"}」 - 
                ${isCorrect ? '<span class="correct">正解◎</span>' : '<span class="incorrect">不正解×</span>'}<br>
                <small>(模範解答: ${question.correct_answers.join(' / ')})</small>
            </li>`;
        });

        resultsHTML += `</ul><p style="text-align:center; font-weight:bold; font-size:1.2em;">${questions.length}問中 ${correctCount}問正解でした！</p>`;
        if (correctCount === questions.length) {
            resultsHTML += `<p style="text-align:center; font-size:1.1em; color:green;">🎉 全問正解！素晴らしい！ 🎉</p>`;
        } else if (correctCount > questions.length / 2) {
            resultsHTML += `<p style="text-align:center; font-size:1.1em; color:blue;">👍 よくできました！その調子！ 👍</p>`;
        } else {
            resultsHTML += `<p style="text-align:center; font-size:1.1em; color:orange;">✊ もう少し！頑張ろう！ ✊</p>`;
        }
        resultsHTML += '<button onclick="restartTest()">もう一度挑戦する</button>';
        resultAreaElement.innerHTML = resultsHTML;
    }
    
    // グローバルスコープに関数を配置して、HTMLから呼び出せるようにする
    window.restartTest = () => {
        currentQuestionIndex = 0;
        userAnswers = [];
        displayQuestion();
    };

    // 解答の正規化関数 (ひらがなをカタカナに、全角英数を半角に、スペース削除など)
    function normalizeAnswer(str) {
        if (typeof str !== 'string') return '';
        str = str.replace(/\s+/g, ''); // スペース除去
        str = str.replace(/　+/g, ''); // 全角スペース除去
        str = str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) { // 全角英数を半角に
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
        str = str.replace(/ー/g, '−'); // 長音符の揺れ吸収など、必要に応じて追加
        // ひらがなをカタカナに（簡易版、必要ならより詳細なライブラリを検討）
        // str = str.replace(/[\u3041-\u3096]/g, function(match) {
        //     var chr = match.charCodeAt(0) + 0x60;
        //     return String.fromCharCode(chr);
        // });
        return str.toUpperCase(); // 大文字に統一 (アルファベットの解答がある場合)
    }


    submitButton.addEventListener('click', handleSubmit);
    answerInputElement.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
        }
    });

    loadQuestions();
});
