const articleWords =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas at interdum leo. Sed eget faucibus sapien. Etiam laoreet eleifend enim, eu mollis velit imperdiet quis.`
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .split(" ");

const articles = new Array(5).fill(1).map(() => {
  const getRandomWord = (upperCase) => {
    const word = articleWords[Math.floor(Math.random() * articleWords.length)];
    return upperCase ? word[0].toUpperCase() + word.substring(1) : word;
  };

  const getSentence = (wordsCount, dot) => {
    let sentence = getRandomWord(true);
    for (let i = 1; i < wordsCount; i++) {
      sentence += ` ${getRandomWord()}`;
    }
    return dot ? `${sentence}. ` : sentence;
  };

  const getDate = () => {
    const daysBackwards =
      1000 * 60 * 60 * 24 * Math.floor(Math.random() * 1000);
    return new Date(Date.now() - daysBackwards);
  };

  const content = new Array(5).fill(1).map(() => {
    return {
      header: getSentence(Math.floor(Math.random() * 5) + 1),
      paragraph: new Array(10)
        .fill(1)
        .map(() => getSentence(Math.floor(Math.random() * 8) + 8, true))
        .join()
        .toString()
        .replaceAll(",", ""),
    };
  });

  return {
    author: `${getRandomWord(true)} ${getRandomWord(true)}`,
    title: getSentence(Math.floor(Math.random() * 4) + 1),
    description: new Array(3)
      .fill(1)
      .map(() => getSentence(Math.floor(Math.random() * 8) + 8, true))
      .join()
      .toString()
      .replaceAll(",", ""),
    content,
    date: getDate(),
    tags: new Array(7).fill(1).map(() => getRandomWord()),
  };
});

console.log(articles);
