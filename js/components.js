"use-strict";

class Component {
  constructor(className) {
    this.body = document.createElement("div");
    this.body.classList.add(className);
    this.innerBody = document.createElement("div");
    this.body.append(this.innerBody);
    this.body.onclick = () => {
      if (this.onClick) {
        this.onClick();
      }
    };
    return this;
  }
  setState(state) {
    if (this.state !== state) {
      this.state = state;
      if (!this.render) {
        throw new Error("Component has not render function");
      }
      this.render();
    }
  }
}

/* Article List */

class ArticleList extends Component {
  render() {
    if (!this.state.articles) {
      throw new Error("There is no any articles loaded");
    }
    const nodes = Object.values(
      Object.entries(this.state.articles).reduce((nodes, [year, yearContent]) => {
        const header = document.createElement("h3");
        header.innerHTML = year;
        nodes[year] = [header];
        Object.entries(yearContent).map(([monthName, monthArticles]) => {
          const monthComponent = new MonthTab("month-tab");
          nodes[year].push(monthComponent.body);
          monthComponent.setState({
            name: monthName,
            articles: monthArticles,
          });
          observe(store.selectedMonthTab, () => {
            monthComponent.select();
          });
        });
        return nodes;
      }, {})
    );
    this.innerBody.innerHTML = "<h1>Articles</h1>";
    nodes.reverse().map((year) => {
      year.map((element) => {
        this.innerBody.append(element);
      });
    });
  }

  toggleCreateArticleButton(user) {
    const button = this.innerBody.querySelector(".create-article");
    if (button) {
      button.remove();
    }
    if (!user) return;
    if (user.isAuthor) {
      const button = document.createElement("button");
      button.className = "create-article";
      button.innerHTML = "Create new article...";
      button.onclick = () => {
        new ArticleModal();
      };
      this.innerBody.prepend(button);
    }
  }
}

class MonthTab extends Component {
  render() {
    if (!this.state.articles || !this.state.name) {
      throw new Error("There is no any articles loaded in this month");
    }
    const header = document.createElement("li");
    header.innerHTML = this.state.name;
    this.innerBody.innerHTML = "";
    this.innerBody.append(header);
    this.monthArticles = document.createElement("ul");
    this.innerBody.appendChild(this.monthArticles);
  }

  onClick() {
    dispatch(store.selectedMonthTab, this);
  }

  select() {
    if (store.selectedMonthTab.state == this) {
      if (!this.areArticlesLoaded) this.loadArticles();
      this.body.classList.add("selected");
    } else {
      this.body.classList.remove("selected");
    }
  }

  loadArticles() {
    const articles = this.state.articles.map((article) => {
      const tab = new ArticleTab("article-tab");
      observe(store.selectedArticle, () => {
        tab.select();
      });
      tab.setState({ article });
      return tab;
    });
    articles.map((article) => {
      this.monthArticles.append(article.body);
    });
    this.areArticlesLoaded = true;
  }
}

class ArticleTab extends Component {
  render() {
    if (!this.state.article) {
      throw new Error("Wrong article tab data");
    }
    const { title, date } = this.state.article;
    const articleTitle = document.createElement("h5");
    articleTitle.innerHTML = `
      <div class='article-tab-wrapper'>
        <h5>${title}</h5>
        <p>${convertDate("article-tab", date)}</p>
      </div>
    `;
    this.innerBody.append(articleTitle);
  }

  select() {
    if (store.selectedArticle.state == this) {
      this.body.classList.add("selected");
    } else {
      this.body.classList.remove("selected");
    }
  }

  onClick() {
    dispatch(store.selectedArticle, this);
  }
}

/* Article Body */

class ArticleBox extends Component {
  render() {
    if (!this.state.article) {
      throw new Error("Wrong article data");
    }
    const { content, date, description, tags, title, userId, _id } =
      this.state.article.state.article;
    const user = queries.getUser(userId);
    this.innerBody.innerHTML = `
      <h1>${title}</h1>
      <div class='article-author'>
        <i class="fa-solid fa-user"></i>
        <h5>${user.name}</h5>
        <p>${convertDate("article", date)}</p>
      </div>
      <h3>${description}</h3>
      <div class='article-content'>
        ${content
          .map((section) => {
            return `
          <h4>${section.header}</h4>
          <p>${section.paragraph}</p>
        `;
          })
          .join()
          .replaceAll(",", "")}
      </div>
    `;
  }
}

class CommentsBox extends Component {
  render() {
    if (!this.state.article) {
      throw new Error("Wrong comments data");
    }
    const { _id } = this.state.article.state.article;
    const comments = queries.getCommentsOfArticle(_id);

    this.innerBody.innerHTML = `
      <h2>Comments (${comments.length})</h2>
      <ul>
        ${comments
          .map((comment) => {
            const user = queries.getUser(comment.userId);
            return `
            <li class='comment'>
              <i class=" fa-solid fa-message "></i>
              <div>
                <h5>
                  ${user.name}
                </h5>
                <p>
                  ${comment.content}
                </p>
              </div>
              ${convertDate("comment", comment.date)}
            </li>
          `;
          })
          .join()
          .replaceAll(",", "")}
      </ul>
    `;
  }
}

class CommentTyper extends Component {
  render() {
    if (!this.state.article) {
      this.innerBody.innerHTML = "";
      return;
    }
    if (!this.state.user) {
      this.innerBody.innerHTML = `
      <div class='login-to-comment'>
        <h3>Log in to comment</h3>
        <button>Log in</button>
      </div>  
      `;
      this.innerBody.querySelector("button").onclick = () => {
        new LoginModal();
      };
    } else {
      this.innerBody.innerHTML = `
      <h3>Type comment:</h3>
      <input type='text' class='comment-text' placeholder='Comment...'></input>
      <button>Send</button>
    `;
      const comment = this.innerBody.querySelector(".comment-text");
      comment.onkeydown = (e) => {
        if (e.key === "Enter") {
          this.sendComment(comment);
        }
      };
      this.innerBody.querySelector("button").onclick = () => {
        this.sendComment(comment);
      };
    }
  }

  sendComment(comment) {
    if (comment.value.length > 0) {
      const newComment = store.loggedUser.state.createComment(
        this.state.article.state.article._id,
        {
          content: comment.value,
          date: new Date(Date.now()),
        }
      );
      comment.value = "";
      queries.createComment(newComment);
      dispatch(store.newComments, newComment);
    }
  }
}

/* Blog Details */

class BlogDetailsBox extends Component {
  render() {
    if (!this.state.users || !this.state.tags) {
      throw new Error("Wrong blog details data");
    }

    this.innerBody.innerHTML = `
      <h2>Most active users</h2>
      <ul>
        ${this.state.users
          .map((user) => {
            return `
              <li class='top-commentator'>
                <h5>${user.user}</h5>
                <p>${user.amount} comments</p>
              </li>
            `;
          })
          .join()
          .replaceAll(",", "")}
      </ul>
      <h2>Top tags</h2>
      <ul>
          ${this.state.tags
            .map(([tag, amount]) => {
              return `
              <li class='top-tags'>
                <i class="fa-solid fa-tag"></i>
                <h5>${tag}</h5>
                <p>${amount}</p>
              </li>
            `;
            })
            .join()
            .replaceAll(",", "")}
      </ul>
    `;
  }
}
