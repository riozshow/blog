"use-strict";

const convertDate = (type, date) => {
  switch (type) {
    case "article-tab":
      return new Date(date).toLocaleDateString();
    case "article":
      return new Date(date).toDateString();
    case "comment":
      return `<div class='date'>
        <p>${new Date(date).toDateString()}</p><p>${new Date(date).toLocaleTimeString()}</p></div>`;
  }
};
