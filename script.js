let books = JSON.parse(localStorage.getItem("wordQuestBooks") || "[]");
let coins = Number(localStorage.getItem("wordQuestCoins") || 0);
let level = Number(localStorage.getItem("wordQuestLevel") || 1);
let xp = Number(localStorage.getItem("wordQuestXP") || 0);
let streak = Number(localStorage.getItem("wordQuestStreak") || 0);

let ownedBackgrounds = JSON.parse(
  localStorage.getItem("wordQuestBackgrounds") || '["default"]'
);

let currentBackground =
  localStorage.getItem("wordQuestCurrentBackground") || "default";

let currentBookId = null;

let studyWords = [];
let studyIndex = 0;

let quizWords = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

let writingWords = [];
let writingIndex = 0;
let writingAnswered = false;


/* =========================
   저장
========================= */

function saveGame() {
  localStorage.setItem("wordQuestBooks", JSON.stringify(books));
  localStorage.setItem("wordQuestCoins", coins);
  localStorage.setItem("wordQuestLevel", level);
  localStorage.setItem("wordQuestXP", xp);
  localStorage.setItem("wordQuestStreak", streak);
  localStorage.setItem(
    "wordQuestBackgrounds",
    JSON.stringify(ownedBackgrounds)
  );
  localStorage.setItem(
    "wordQuestCurrentBackground",
    currentBackground
  );
}


/* =========================
   페이지 이동
========================= */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(function(page) {
    page.classList.remove("active");
  });

  var page = document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }

  window.scrollTo(0, 0);
}


/* =========================
   단어장 목록
========================= */

function displayBooks() {
  var list = document.getElementById("bookList");

  if (!list) return;

  list.innerHTML = "";

  if (books.length === 0) {
    list.innerHTML =
      '<div class="empty-state">' +
      '<div>📖</div>' +
      '<p>아직 단어장이 없어요.</p>' +
      '<p>새 단어장을 만들어보세요!</p>' +
      '</div>';

    return;
  }

  books.forEach(function(book) {
    var card = document.createElement("div");

    card.className = "book-card";

    var wordCount = Array.isArray(book.words)
      ? book.words.length
      : 0;

    card.innerHTML =
      '<div class="book-card-icon">📚</div>' +
      '<div class="book-card-info">' +
      '<h3>' + escapeHTML(book.name) + '</h3>' +
      '<p>' + wordCount + '개의 단어</p>' +
      '</div>';

    card.onclick = function() {
      openBook(book.id);
    };

    list.appendChild(card);
  });
}


/* =========================
   단어장 만들기
========================= */

function openCreateBook() {
  var modal = document.getElementById("bookModal");

  if (modal) {
    modal.classList.add("show");
  }

  var input = document.getElementById("bookNameInput");

  if (input) {
    input.value = "";

    setTimeout(function() {
      input.focus();
    }, 50);
  }
}


function closeModal() {
  var modal = document.getElementById("bookModal");

  if (modal) {
    modal.classList.remove("show");
  }
}


function createBook() {
  var input = document.getElementById("bookNameInput");

  if (!input) return;

  var name = input.value.trim();

  if (!name) {
    alert("단어장 이름을 입력해주세요!");
    input.focus();
    return;
  }

  var newBook = {
    id: Date.now(),
    name: name,
    words: []
  };

  books.push(newBook);

  saveGame();
  displayBooks();
  closeModal();

  openBook(newBook.id);
}


/* =========================
   단어장 열기
========================= */

function openBook(id) {
  currentBookId = id;

  var book = getCurrentBook();

  if (!book) {
    alert("단어장을 찾을 수 없습니다.");
    return;
  }

  showPage("bookPage");

  var title = document.getElementById("currentBookTitle");
  var count = document.getElementById("currentBookCount");

  if (title) {
    title.textContent = book.name;
  }

  if (count) {
    count.textContent = book.words.length + "개의 단어";
  }

  displayWords();
  displayMasterySummary();
}


function openCurrentBook() {
  if (currentBookId !== null) {
    openBook(currentBookId);
  } else {
    showPage("booksPage");
  }
}


function getCurrentBook() {
  return books.find(function(book) {
    return book.id === currentBookId;
  });
}


/* =========================
   단어 추가
========================= */

function addWord() {
  var book = getCurrentBook();

  if (!book) {
    alert("먼저 단어장을 선택해주세요.");
    return;
  }

  var englishInput = document.getElementById("englishInput");
  var koreanInput = document.getElementById("koreanInput");

  if (!englishInput || !koreanInput) return;

  var english = englishInput.value.trim();
  var korean = koreanInput.value.trim();

  if (!english || !korean) {
    alert("영어 단어와 한국어 뜻을 모두 입력해주세요!");
    return;
  }

  var exists = book.words.some(function(word) {
    return word.english.toLowerCase() === english.toLowerCase();
  });

  if (exists) {
    alert("이미 있는 단어입니다!");
    return;
  }

  book.words.push({
    english: english,
    korean: korean,
    correct: 0,
    wrong: 0
  });

  englishInput.value = "";
  koreanInput.value = "";

  saveGame();
  displayWords();
  displayMasterySummary();

  englishInput.focus();
}


/* =========================
   단어 삭제
========================= */

function deleteWord(index) {
  var book = getCurrentBook();

  if (!book) return;

  if (!confirm("이 단어를 삭제할까요?")) {
    return;
  }

  book.words.splice(index, 1);

  saveGame();
  displayWords();
  displayMasterySummary();
}


function deleteCurrentBook() {
  var book = getCurrentBook();

  if (!book) return;

  var message =
    '"' +
    book.name +
    '" 단어장을 삭제할까요?\n\n모든 단어도 함께 삭제됩니다.';

  if (!confirm(message)) {
    return;
  }

  books = books.filter(function(item) {
    return item.id !== currentBookId;
  });

  currentBookId = null;

  saveGame();
  displayBooks();
  showPage("booksPage");
}


/* =========================
   암기 상태
========================= */

function getMastery(word) {
  if (word.correct >= 3 && word.correct > word.wrong) {
    return "perfect";
  }

  if (word.wrong >= 2 || word.correct < word.wrong) {
    return "review";
  }

  return "practice";
}


function getMasteryInfo(word) {
  var mastery = getMastery(word);

  if (mastery === "perfect") {
    return {
      icon: "🟢",
      text: "완벽"
    };
  }

  if (mastery === "review") {
    return {
      icon: "🔴",
      text: "복습 필요"
    };
  }

  return {
    icon: "🟡",
    text: "연습 중"
  };
}


/* =========================
   암기 통계
========================= */

function displayMasterySummary() {
  var book = getCurrentBook();

  if (!book) return;

  var perfect = 0;
  var practice = 0;
  var review = 0;

  book.words.forEach(function(word) {
    var mastery = getMastery(word);

    if (mastery === "perfect") {
      perfect++;
    } else if (mastery === "review") {
      review++;
    } else {
      practice++;
    }
  });

  var perfectEl = document.getElementById("perfectCount");
  var practiceEl = document.getElementById("practiceCount");
  var reviewEl = document.getElementById("reviewCount");

  if (perfectEl) {
    perfectEl.textContent = perfect;
  }

  if (practiceEl) {
    practiceEl.textContent = practice;
  }

  if (reviewEl) {
    reviewEl.textContent = review;
  }
}


/* =========================
   단어 목록
========================= */

function displayWords() {
  var book = getCurrentBook();
  var list = document.getElementById("wordList");

  if (!book || !list) return;

  list.innerHTML = "";

  if (book.words.length === 0) {
    list.innerHTML =
      '<div class="empty-state">' +
      '<div>📝</div>' +
      '<p>아직 단어가 없습니다.</p>' +
      '</div>';

    return;
  }

  book.words.forEach(function(word, index) {
    var info = getMasteryInfo(word);

    var item = document.createElement("div");

    item.className = "word-item";

    item.innerHTML =
      '<div class="word-main">' +
      '<strong>' + escapeHTML(word.english) + '</strong>' +
      '<span>' + escapeHTML(word.korean) + '</span>' +
      '</div>' +
      '<div class="word-status">' +
      '<span>' +
      info.icon +
      " " +
      info.text +
      '</span>' +
      '<small>' +
      "정답 " +
      word.correct +
      " / 오답 " +
      word.wrong +
      '</small>' +
      '</div>' +
      '<button class="delete-word-btn">삭제</button>';

    var deleteButton =
      item.querySelector(".delete-word-btn");

    if (deleteButton) {
      deleteButton.onclick = function() {
        deleteWord(index);
      };
    }

    list.appendChild(item);
  });
}


/* =========================
   암기 카드
========================= */

function startStudy() {
  var book = getCurrentBook();

  if (!book || book.words.length === 0) {
    alert("먼저 단어를 추가해주세요!");
    return;
  }

  studyWords = book.words.slice();
  studyIndex = 0;

  showPage("studyPage");

  updateStudyCard();
}


function updateStudyCard() {
  if (studyWords.length === 0) return;

  var word = studyWords[studyIndex];

  var progress =
    document.getElementById("studyProgress");

  var english =
    document.getElementById("studyEnglish");

  var korean =
    document.getElementById("studyKorean");

  var flashcard =
    document.getElementById("flashcard");

  if (progress) {
    progress.textContent =
      (studyIndex + 1) +
      " / " +
      studyWords.length;
  }

  if (english) {
    english.textContent = word.english;
  }

  if (korean) {
    korean.textContent = word.korean;
  }

  if (flashcard) {
    flashcard.classList.remove("flipped");
  }
}


function flipCard() {
  var card = document.getElementById("flashcard");

  if (card) {
    card.classList.toggle("flipped");
  }
}


function nextCard() {
  if (studyWords.length === 0) return;

  studyIndex++;

  if (studyIndex >= studyWords.length) {
    studyIndex = 0;
  }

  updateStudyCard();
}


function prevCard() {
  if (studyWords.length === 0) return;

  studyIndex--;

  if (studyIndex < 0) {
    studyIndex = studyWords.length - 1;
  }

  updateStudyCard();
}


/* =========================
   전체 퀴즈
========================= */

function startQuiz() {
  var book = getCurrentBook();

  if (!book || book.words.length === 0) {
    alert("먼저 단어를 추가해주세요!");
    return;
  }

  quizWords = shuffle(book.words.slice());

  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;

  var type = document.getElementById("quizType");

  if (type) {
    type.textContent = "전체 퀴즈";
  }

  showPage("quizPage");

  showQuizQuestion();
}


/* =========================
   복습 퀴즈
========================= */

function startReviewQuiz() {
  var book = getCurrentBook();

  if (!book) return;

  var reviewWords = book.words.filter(function(word) {
    return getMastery(word) === "review";
  });

  if (reviewWords.length === 0) {
    alert("복습이 필요한 단어가 없습니다! 🎉");
    return;
  }

  quizWords = shuffle(reviewWords);

  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;

  var type = document.getElementById("quizType");

  if (type) {
    type.textContent = "복습 퀴즈";
  }

  showPage("quizPage");

  showQuizQuestion();
}


/* =========================
   퀴즈 문제
========================= */

function showQuizQuestion() {
  if (quizIndex >= quizWords.length) {
    finishQuiz();
    return;
  }

  quizAnswered = false;

  var word = quizWords[quizIndex];

  var english =
    document.getElementById("quizEnglish");

  var progress =
    document.getElementById("quizProgress");

  var score =
    document.getElementById("quizScore");

  var answerArea =
    document.getElementById("answerArea");

  var feedback =
    document.getElementById("quizFeedback");

  var nextButton =
    document.getElementById("nextQuizBtn");

  if (english) {
    english.textContent = word.english;
  }

  if (progress) {
    progress.textContent =
      (quizIndex + 1) +
      " / " +
      quizWords.length;
  }

  if (score) {
    score.textContent =
      "점수: " +
      quizScore;
  }

  if (feedback) {
    feedback.textContent = "";
    feedback.className = "quiz-feedback";
  }

  if (nextButton) {
    nextButton.classList.add("hidden");
  }

  if (answerArea) {
    answerArea.innerHTML = "";
  }

  createAnswers(word);
}


/* =========================
   보기 만들기
========================= */

function createAnswers(correctWord) {
  var answerArea =
    document.getElementById("answerArea");

  if (!answerArea) return;

  var book = getCurrentBook();

  if (!book) return;

  var otherWords = book.words.filter(function(word) {
    return word !== correctWord;
  });

  otherWords =
    shuffle(otherWords).slice(0, 3);

  var choices =
    shuffle([correctWord].concat(otherWords));

  choices.forEach(function(choice) {
    var button =
      document.createElement("button");

    button.className = "answer-btn";

    button.textContent =
      choice.korean;

    button.onclick = function() {
      checkAnswer(
        choice === correctWord,
        button
      );
    };

    answerArea.appendChild(button);
  });
}


/* =========================
   정답 확인
========================= */

function checkAnswer(isCorrect, button) {
  if (quizAnswered) return;

  quizAnswered = true;

  var word = quizWords[quizIndex];

  var buttons =
    document.querySelectorAll(".answer-btn");

  buttons.forEach(function(btn) {
    btn.disabled = true;
  });

  var feedback =
    document.getElementById("quizFeedback");

  var nextButton =
    document.getElementById("nextQuizBtn");

  if (isCorrect) {
    word.correct++;

    quizScore++;

    streak++;

    var earnedCoins =
      Math.floor(Math.random() * 2) + 2;

    coins += earnedCoins;

    var earnedXP =
      10 + ((streak - 1) * 2);

    addXP(earnedXP);

    if (feedback) {
      feedback.textContent =
        "🎉 정답! +" +
        earnedCoins +
        " 🪙   +" +
        earnedXP +
        " XP";

      feedback.className =
        "quiz-feedback correct";
    }

    if (button) {
      button.classList.add("correct");
    }
  } else {
    word.wrong++;

    streak = 0;

    if (feedback) {
      feedback.textContent =
        "❌ 아쉬워요! 정답은 " +
        word.korean +
        " 입니다.";

      feedback.className =
        "quiz-feedback wrong";
    }

    if (button) {
      button.classList.add("wrong");
    }

    buttons.forEach(function(btn) {
      if (btn.textContent === word.korean) {
        btn.classList.add("correct");
      }
    });
  }

  updateCoins();

  displayMasterySummary();

  saveGame();

  if (nextButton) {
    nextButton.classList.remove("hidden");
  }
}


/* =========================
   다음 퀴즈
========================= */

function nextQuestion() {
  if (!quizAnswered) return;

  quizIndex++;

  showQuizQuestion();
}


function finishQuiz() {
  alert(
    "🎉 퀴즈 완료!\n\n" +
    "점수: " +
    quizScore +
    " / " +
    quizWords.length
  );

  openCurrentBook();
}


/* =========================
   해석 연습장
========================= */

function startWritingPractice() {
  var book = getCurrentBook();

  if (!book || book.words.length === 0) {
    alert("먼저 단어를 추가해주세요!");
    return;
  }

  writingWords =
    shuffle(book.words.slice());

  writingIndex = 0;
  writingAnswered = false;

  showPage("writingPage");

  showWritingQuestion();
}


function showWritingQuestion() {
  if (writingIndex >= writingWords.length) {
    finishWritingPractice();
    return;
  }

  writingAnswered = false;

  var word = writingWords[writingIndex];

  var progress =
    document.getElementById("writingProgress");

  var english =
    document.getElementById("writingEnglish");

  var input =
    document.getElementById("writingInput");

  var feedback =
    document.getElementById("writingFeedback");

  var nextButton =
    document.getElementById("nextWritingBtn");

  if (progress) {
    progress.textContent =
      (writingIndex + 1) +
      " / " +
      writingWords.length;
  }

  if (english) {
    english.textContent = word.english;
  }

  if (input) {
    input.value = "";
    input.disabled = false;

    setTimeout(function() {
      input.focus();
    }, 50);
  }

  if (feedback) {
    feedback.textContent = "";
    feedback.className = "";
  }

  if (nextButton) {
    nextButton.classList.add("hidden");
  }
}


function checkWritingAnswer() {
  if (writingAnswered) return;

  var input =
    document.getElementById("writingInput");

  var feedback =
    document.getElementById("writingFeedback");

  var nextButton =
    document.getElementById("nextWritingBtn");

  if (!input) return;

  var userAnswer =
    normalizeAnswer(input.value);

  if (!userAnswer) {
    alert("뜻을 입력해주세요!");
    input.focus();
    return;
  }

  var word =
    writingWords[writingIndex];

  writingAnswered = true;

  input.disabled = true;

  if (
    userAnswer ===
    normalizeAnswer(word.korean)
  ) {
    word.correct++;

    streak++;

    var earnedCoins =
      Math.floor(Math.random() * 2) + 2;

    coins += earnedCoins;

    var earnedXP =
      10 + ((streak - 1) * 2);

    addXP(earnedXP);

    if (feedback) {
      feedback.textContent =
        "🎉 정답!\n+" +
        earnedCoins +
        " 🪙  +" +
        earnedXP +
        " XP";

      feedback.className = "correct";
    }
  } else {
    word.wrong++;

    streak = 0;

    if (feedback) {
      feedback.textContent =
        "❌ 오답!\n정답: " +
        word.korean;

      feedback.className = "wrong";
    }
  }

  updateCoins();

  saveGame();

  if (nextButton) {
    nextButton.classList.remove("hidden");
  }
}


function nextWritingQuestion() {
  if (!writingAnswered) return;

  writingIndex++;

  showWritingQuestion();
}


function finishWritingPractice() {
  alert("🎉 해석 연습 완료!");

  openCurrentBook();
}


/* =========================
   XP
========================= */

function requiredXP() {
  if (level >= 10) {
    return Infinity;
  }

  return 50 * Math.pow(2, level - 1);
}


function addXP(amount) {
  if (level >= 10) {
    xp = 0;

    updateLevel();
    saveGame();

    return;
  }

  xp += amount;

  while (
    level < 10 &&
    xp >= requiredXP()
  ) {
    xp -= requiredXP();

    level++;

    var reward =
      (level - 1) * 10;

    coins += reward;

    updateCoins();

    if (level === 10) {
      xp = 0;

      alert(
        "👑 최고 레벨 달성!\n\n" +
        "Lv.10 MAX\n\n" +
        "🎁 레벨업 보상 +" +
        reward +
        " 🪙"
      );
    } else {
      alert(
        "🎉 레벨 업!\n\n" +
        "Lv." +
        level +
        " 달성!\n\n" +
        "🎁 레벨업 보상 +" +
        reward +
        " 🪙"
      );
    }
  }

  updateLevel();
  saveGame();
}


function updateLevel() {
  var levelText =
    document.getElementById("levelText");

  var xpText =
    document.getElementById("xpText");

  var xpFill =
    document.getElementById("xpFill");

  if (levelText) {
    levelText.textContent =
      "Lv." + level;
  }

  if (level >= 10) {
    if (xpText) {
      xpText.textContent = "MAX";
    }

    if (xpFill) {
      xpFill.style.width = "100%";
    }

    return;
  }

  var needed = requiredXP();

  if (xpText) {
    xpText.textContent =
      xp +
      " / " +
      needed +
      " XP";
  }

  if (xpFill) {
    var percentage =
      Math.min(
        (xp / needed) * 100,
        100
      );

    xpFill.style.width =
      percentage + "%";
  }
}


/* =========================
   코인
========================= */

function updateCoins() {
  var coinText =
    document.getElementById("coinText");

  if (coinText) {
    coinText.textContent = coins;
  }
}


/* =========================
   배경 상점
========================= */

function buyBackground(background, price) {
  if (
    ownedBackgrounds.includes(background)
  ) {
    setBackground(background);
    return;
  }

  if (coins < price) {
    alert(
      "🪙 코인이 부족합니다!\n\n" +
      "필요한 코인: " +
      price +
      "\n" +
      "현재 코인: " +
      coins
    );

    return;
  }

  coins -= price;

  ownedBackgrounds.push(background);

  setBackground(background);

  updateCoins();

  saveGame();

  alert("🎉 배경을 구매했습니다!");
}


function setBackground(background) {
  currentBackground = background;

  document.body.classList.remove(
    "bg-grass",
    "bg-cave",
    "bg-space",
    "bg-ruins",
    "bg-retro",
    "bg-gold"
  );

  if (background !== "default") {
    document.body.classList.add(
      "bg-" + background
    );
  }

  saveGame();
}


function applyBackground() {
  document.body.classList.remove(
    "bg-grass",
    "bg-cave",
    "bg-space",
    "bg-ruins",
    "bg-retro",
    "bg-gold"
  );

  if (currentBackground !== "default") {
    document.body.classList.add(
      "bg-" + currentBackground
    );
  }
}


/* =========================
   기타
========================= */

function shuffle(array) {
  var result = array.slice();

  for (
    var i = result.length - 1;
    i > 0;
    i--
  ) {
    var j =
      Math.floor(
        Math.random() * (i + 1)
      );

    var temp = result[i];

    result[i] = result[j];
    result[j] = temp;
  }

  return result;
}


function normalizeAnswer(text) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}


function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   기존 데이터 정리
========================= */

function normalizeBooks() {
  books.forEach(function(book) {

    if (!book.id) {
      book.id =
        Date.now() +
        Math.random();
    }

    if (!book.name) {
      book.name = "새 단어장";
    }

    if (!Array.isArray(book.words)) {
      book.words = [];
    }

    book.words.forEach(function(word) {

      if (
        typeof word.correct !==
        "number"
      ) {
        word.correct =
          Number(word.correct) || 0;
      }

      if (
        typeof word.wrong !==
        "number"
      ) {
        word.wrong =
          Number(word.wrong) || 0;
      }

    });
  });

  saveGame();
}


/* =========================
   키보드
========================= */

document.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Escape") {
      closeModal();
    }

    if (
      event.key === "Enter" &&
      document.activeElement &&
      document.activeElement.id ===
        "bookNameInput"
    ) {
      createBook();
    }

    if (
      event.key === "Enter" &&
      document.activeElement &&
      document.activeElement.id ===
        "writingInput"
    ) {
      checkWritingAnswer();
    }

  }
);


/* =========================
   모달 바깥 클릭
========================= */

document.addEventListener(
  "click",
  function(event) {

    var modal =
      document.getElementById(
        "bookModal"
      );

    if (
      modal &&
      event.target === modal
    ) {
      closeModal();
    }

  }
);


/* =========================
   시작
========================= */

normalizeBooks();
displayBooks();
updateCoins();
updateLevel();
applyBackground();
