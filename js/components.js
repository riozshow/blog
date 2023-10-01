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

      if (this.template) {
        this.templateRenderer = Handlebars.compile(this.template.innerHTML);
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
      Object.entries(this.state.articles).reduce(
        (nodes, [year, yearContent]) => {
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
        },
        {}
      )
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
  template = document.querySelector("#template-article-tab");

  render() {
    if (!this.state.article) {
      throw new Error("Wrong article tab data");
    }
    const { title, date } = this.state.article;
    const convertedDate = convertDate("article-tab", date);
    this.innerBody.innerHTML = this.templateRenderer({
      title,
      date: convertedDate,
    });
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
  template = document.querySelector("#template-article-body");

  render() {
    if (!this.state.article) {
      throw new Error("Wrong article data");
    }
    const { content, date, description, title, userId } =
      this.state.article.state.article;
    const user = queries.getUser(userId);

    const templateData = {
      title,
      user: user.name,
      date: convertDate("article", date),
      description,
      sections: content,
    };

    this.innerBody.innerHTML = this.templateRenderer(templateData);
  }
}

class CommentsBox extends Component {
  template = document.querySelector("#template-article-comments");

  render() {
    if (!this.state.article) {
      throw new Error("Wrong comments data");
    }
    const { _id } = this.state.article.state.article;
    const comments = queries.getCommentsOfArticle(_id).map((comment) => {
      comment.user = queries.getUser(comment.userId).name;
      comment.time = new Date(comment.date).toLocaleTimeString();
      comment.date = new Date(comment.date).toDateString();
      return comment;
    });

    const templateData = {
      commentsAmount: comments.length,
      comments,
    };

    this.innerBody.innerHTML = this.templateRenderer(templateData);
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
  template = document.querySelector("#template-blog-details");

  render() {
    if (!this.state.users || !this.state.tags) {
      throw new Error("Wrong blog details data");
    }

    const templateData = {
      users: this.state.users,
      tags: this.state.tags.map(([tag, amount]) => ({
        tag,
        amount,
      })),
    };

    this.innerBody.innerHTML = this.templateRenderer(templateData);
  }
}
