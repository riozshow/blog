/* Header */

const accountButtons = document.querySelector("#account-buttons");
const loginButton = document.querySelector("#login-button");
loginButton.onclick = () => {
  new LoginModal();
};
const registerButton = document.querySelector("#register-button");
registerButton.onclick = () => {
  new RegisterModal();
};
const userInfo = document.querySelector("#user-info");
const logoutButton = document.querySelector("#logout-button");
const userName = document.querySelector("#user-name");
logoutButton.onclick = () => {
  dispatch(store.loggedUser, null);
};
observe(store.loggedUser, () => {
  if (store.loggedUser.state) {
    accountButtons.classList.remove("show");
    userInfo.classList.add("show");
    userName.innerHTML = `${store.loggedUser.state.name} ${
      store.loggedUser.state.isAuthor ? " | Author" : ""
    }`;
  } else {
    userName.innerHTML = "";
    accountButtons.classList.add("show");
    userInfo.classList.remove("show");
  }
});

/* Articles List */

const articleListBox = document.querySelector("#articles");
const articleListComponent = new ArticleList("article-list");
articleListBox.append(articleListComponent.body);
articleListComponent.setState({ articles: queries.getAllArticles() });
observe(store.loggedUser, () => {
  articleListComponent.toggleCreateArticleButton(store.loggedUser.state);
});
observe(store.newArticles, () => {
  articleListComponent.setState({
    ...articleListComponent.state,
    ...{ articles: queries.getAllArticles() },
  });
  articleListComponent.toggleCreateArticleButton(store.loggedUser.state);
  document.querySelector(".month-tab").click();
  document.querySelector(".article-tab").click();
});

/* Articles body */

const articleBody = document.querySelector("#selected-article");
const articleComponent = new ArticleBox("article-box");
articleBody.append(articleComponent.body);
const commentTyper = new CommentTyper("comment-typer");
articleBody.append(commentTyper.body);
const commentsBox = new CommentsBox("comments-box");
articleBody.append(commentsBox.body);

observe(store.selectedArticle, () => {
  articleComponent.setState({ article: store.selectedArticle.state });
  commentsBox.setState({ article: store.selectedArticle.state });
  commentTyper.setState({
    ...{ ...commentTyper.state },
    article: store.selectedArticle.state,
  });
  articleBody.scrollTop = 0;
});
observe(store.loggedUser, () => {
  commentTyper.setState({
    ...{ ...commentTyper.state },
    user: store.loggedUser.state,
  });
});
observe(store.newComments, () => {
  commentsBox.setState({ article: store.selectedArticle.state });
});

/* Blog Details */

const blogDetails = document.querySelector("#blog-details");
const blogDetailsComponent = new BlogDetailsBox("details-box");
blogDetails.append(blogDetailsComponent.body);
blogDetailsComponent.setState({
  users: queries.getMostActiveUsers(),
  tags: queries.getTopTags(),
});
observe(store.newComments, () => {
  blogDetailsComponent.setState({
    ...{ ...blogDetailsComponent.state },
    ...{
      users: queries.getMostActiveUsers(),
    },
  });
});

/* Default State */

const storedUserData = JSON.parse(localStorage.getItem("user"));
dispatch(store.loggedUser, storedUserData ? new User(storedUserData) : null);
observe(store.loggedUser, () => {
  localStorage.setItem("user", JSON.stringify(store.loggedUser.state));
});
document.querySelector(".month-tab").click();
document.querySelector(".article-tab").click();
