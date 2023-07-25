"use-strict";

const createId = () => {
  return `${Date.now()}-${(Math.random() * 99999)
    .toLocaleString("en-US", {
      minimumIntegerDigits: 5,
    })
    .replaceAll(".", "")
    .replaceAll(",", "")}`;
};

const words =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas at interdum leo. Sed eget faucibus sapien. Etiam laoreet eleifend enim, eu mollis velit imperdiet quis.`
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .split(" ");

const createRandomWord = (upperCase) => {
  const word = words[Math.floor(Math.random() * words.length)];
  return upperCase ? word[0].toUpperCase() + word.substring(1) : word;
};

const createRandomSentence = (wordsCount, dot) => {
  let sentence = createRandomWord(true);
  for (let i = 1; i < wordsCount; i++) {
    sentence += ` ${createRandomWord()}`;
  }
  return dot ? `${sentence}. ` : sentence;
};

const createRandomDate = () => {
  const daysBackwards = 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 1000);
  return new Date(Date.now() - daysBackwards);
};

const createRandomArticleContent = () => {
  return {
    header: createRandomSentence(Math.floor(Math.random() * 5) + 1),
    paragraph: new Array(10)
      .fill(1)
      .map(() => createRandomSentence(Math.floor(Math.random() * 8) + 8, true))
      .join()
      .toString()
      .replaceAll(",", ""),
  };
};

class User {
  constructor({ _id, login, password, name, isAuthor }) {
    this.schema = {
      login: {
        type: "string",
        unique: true,
      },
      password: {
        type: "string",
      },
      name: {
        type: "string",
      },
      isAuthor: {
        type: "boolean",
      },
    };
    Object.assign(this, { _id, login, password, name, isAuthor });
  }

  createComment(articleId, data) {
    data.userId = this._id;
    const comment = new Comment({ articleId, ...data });
    if (!comment) {
      throw new Error("Wrong comment data");
    }
    return comment;
  }

  createArticle(data) {
    if (!this.isAuthor) throw new Error("Not allowed to create articles");
    data.userId = this._id;
    const article = new Article(data);
    if (!article) {
      throw new Error("Wrong article data");
    }
    return article;
  }
}

class Article {
  constructor({ _id, userId, title, description, content, date, tags }) {
    this.schema = {
      userId: {
        type: "string",
      },
      title: {
        type: "string",
      },
      description: {
        type: "string",
      },
      content: {
        type: "object",
      },
      date: {
        type: "object",
      },
      tags: {
        type: "object",
      },
    };
    Object.assign(this, {
      _id,
      userId,
      title,
      description,
      content,
      date,
      tags,
    });
  }
}

class Comment {
  constructor({ _id, articleId, userId, content, date }) {
    this.schema = {
      userId: {
        type: "string",
      },
      articleId: {
        type: "string",
      },
      content: {
        type: "string",
      },
      date: {
        type: "object",
      },
    };
    Object.assign(this, {
      _id,
      userId,
      content,
      date,
      articleId,
    });
  }
}

class DataBase {
  constructor() {
    this.#loadDataBase() || this.#createDataBase();
  }

  #loadDataBase = () => {
    const data = JSON.parse(localStorage.getItem("blog-data"));
    if (data) {
      this.data = data;
      return 1;
    }
  };

  #createDataBase() {
    this.data = {};

    new Array(10).fill(1).map(() => {
      const author = new User({
        login: `${createRandomWord()}${createId()}`,
        name: `${createRandomWord(true)} ${createRandomWord(true)}`,
        password: createId(),
        isAuthor: true,
      });
      this.insert("users", author);
    });

    new Array(200).fill(1).map(() => {
      const user = new User({
        login: `${createRandomWord()}${createId()}`,
        name: `${createRandomWord(true)} ${createRandomWord(true)}`,
        password: createId(),
        isAuthor: false,
      });
      this.insert("users", user);
    });

    new Array(200).fill(1).map(() => {
      const author = this.find("users", { isAuthor: true }, { random: true });
      const article = author.createArticle({
        title: createRandomSentence(Math.floor(Math.random() * 4) + 1),
        description: new Array(3)
          .fill(1)
          .map(() => createRandomSentence(Math.floor(Math.random() * 8) + 8, true))
          .join()
          .toString()
          .replaceAll(",", ""),
        content: new Array(5).fill(1).map(() => createRandomArticleContent()),
        date: createRandomDate(),
        tags: new Array(7).fill(1).map(() => createRandomWord()),
      });
      this.insert("articles", article);
    });

    new Array(2000).fill(1).map(() => {
      const user = this.find("users", {}, { random: true });
      const article = this.find("articles", {}, { random: true });
      const comment = user.createComment(article._id, {
        content: createRandomSentence(Math.floor(Math.random() * 4) + 1),
        date: createRandomDate(),
      });
      this.insert("comments", comment);
    });
  }

  insert(collection, data) {
    if (typeof data !== "object" || !data.schema || typeof data.schema !== "object") {
      throw new Error("Wrong insert properties");
    }

    const rawData = { _id: createId() };

    Object.keys(data.schema).map((propertyName) => {
      const { type, unique } = data.schema[propertyName];
      if (unique) {
        if (this.find(collection, { [propertyName]: data[propertyName] })) {
          throw new Error(`This ${propertyName} already exist in ${collection}`);
        }
      }

      if (typeof data[propertyName] != type) {
        throw new Error(`Wrong ${collection} property type`);
      }

      rawData[propertyName] = data[propertyName];
    });

    if (!this.data[collection]) {
      this.data[collection] = [];
    }

    if (Object.keys(data.schema).length !== Object.keys(rawData).length - 1) return;

    this.data[collection].push(rawData);

    localStorage.setItem("blog-data", JSON.stringify(this.data));
  }

  find(collection, query, options) {
    if (!this.data[collection]) return;

    let results = this.data[collection]
      .map((document) => {
        for (const property of Object.keys(query)) {
          if (document[property] !== query[property]) return;
        }
        return document;
      })
      .filter((document) => document != null);

    if (Object.keys(query).length === 0) {
      results = [...this.data[collection]];
    }

    if (results.length === 0) return;
    if (results.length === 1) return this.getModel(collection, results[0]);

    if (options) {
      const { random, sort, limit } = options;

      if (random) {
        return this.getModel(collection, results[Math.floor(Math.random() * results.length)]);
      }

      if (sort) {
        results.sort((a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()) * sort);
      }

      if (limit) {
        return results.slice(0, limit).map((result) => this.getModel(collection, result));
      }
    }

    return results.map((result) => this.getModel(collection, result));
  }

  getModel(collection, data) {
    switch (collection) {
      case "users":
        return new User(data);
      case "articles":
        return new Article(data);
      case "comments":
        return new Comment(data);
    }
  }
}

const queries = {
  getAllArticles: () => {
    return dataBase.find("articles", {}, { sort: -1 }).reduce((articleGroup, article) => {
      const year = new Date(article.date).getFullYear();
      const month = new Date(article.date).toLocaleString("default", {
        month: "long",
      });
      const groupName = `${month[0].toUpperCase()}${month.substring(1)} ${year}`;
      if (!articleGroup[year]) {
        articleGroup[year] = { [groupName]: [article] };
      } else {
        if (!articleGroup[year][groupName]) {
          articleGroup[year][groupName] = [article];
        } else {
          articleGroup[year][groupName].push(article);
        }
      }
      return articleGroup;
    }, {});
  },
  getTopTags: () => {
    const tags = dataBase
      .find("articles", {})
      .map((article) => article.tags)
      .flat()
      .reduce((list, tag) => {
        if (list[tag]) {
          list[tag]++;
        } else {
          list[tag] = 1;
        }
        return list;
      }, {});
    return Object.entries(tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  },
  getMostActiveUsers: () => {
    const mostActiveUsers = dataBase
      .find("comments", {})
      .map((comment) => comment.userId)
      .flat()
      .reduce((list, user) => {
        if (list[user]) {
          list[user]++;
        } else {
          list[user] = 1;
        }
        return list;
      }, {});
    return Object.entries(mostActiveUsers)
      .map(([userId, amount]) => {
        const user = dataBase.find("users", { _id: userId });
        return {
          user: user.name,
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  },
  getCommentsOfArticle: (_id) => {
    const comments = dataBase.find("comments", { articleId: _id }, { sort: -1 });
    if (!comments) {
      return [];
    }
    if (comments.length) {
      return comments;
    }
    return [comments];
  },
  getUser: (_id) => {
    return dataBase.find("users", { _id });
  },
  loginUser: (login, password) => {
    return dataBase.find("users", { login, password });
  },
  registerUser: (login, password, name, isAuthor) => {
    const user = new User({ login, password, name, isAuthor });
    dataBase.insert("users", user);
  },
  createComment: (comment) => {
    dataBase.insert("comments", comment);
  },
  createArticle: (article) => {
    dataBase.insert("articles", article);
  },
};

const dataBase = new DataBase();
