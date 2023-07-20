/* Header */

const accountButtons = document.querySelector("#account-buttons");
const loginButton = document.querySelector("#login-button");
const registerButton = document.querySelector("#register-button");
const userInfo = document.querySelector("#user-info");
const logoutButton = document.querySelector("#logout-button");
observe(store.loggedUser, () => {
  if (store.loggedUser.state) {
    accountButtons.classList.remove("show");
    userInfo.classList.add("show");
  } else {
    accountButtons.classList.add("show");
    userInfo.classList.remove("show");
  }
});

dispatch(store.loggedUser, JSON.parse(localStorage.getItem("user")) || null);

/* Articles List */

const articleListBox = document.querySelector("#articles");
const articleListComponent = new ArticleList("article-list");
articleListBox.append(articleListComponent.body);
articleListComponent.setState({ articles: queries.getAllArticles() });

/* Articles body */

const articleBody = document.querySelector("#selected-article");
const articleComponent = new ArticleBox("article-box");
articleBody.append(articleComponent.body);
const commentsBox = new CommentsBox("comments-box");
articleBody.append(commentsBox.body);
observe(store.selectedArticle, () => {
  articleComponent.setState({ article: store.selectedArticle.state });
  commentsBox.setState({ article: store.selectedArticle.state });
  articleBody.scrollTop = 0;
});

/* Blog Details */

const blogDetails = document.querySelector("#blog-details");
const blogDetailsComponent = new BlogDetailsBox("details-box");
blogDetails.append(blogDetailsComponent.body);
blogDetailsComponent.setState({
  users: queries.getMostActiveUsers(),
  tags: queries.getTopTags(),
});
