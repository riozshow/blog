class Modal {
  constructor() {
    this.body = document.createElement("div");
    this.body.classList.add("modal");
    this.innerBody = document.createElement("div");
    this.innerBody.classList.add("modal-window");
    this.body.append(this.innerBody);
    document.body.append(this.body);
    if (!this.render) {
      throw new Error("This modal has no render method");
    }
    this.render();
  }

  close() {
    this.body.remove();
  }
}

class LoginModal extends Modal {
  render() {
    this.innerBody.innerHTML = `
        <h2>Log in</h2>
        <h3 class='red'></h3>
        <input type='text' id='login'></input>
        <input type='password' id='password'></input>
        <div class='bottom-buttons'>
            <button id='submit-login'>Log in</button>
            <button class='close'>Cancel</button>
        </div>
    `;
    const infoText = this.innerBody.querySelector("h3");
    const loginInput = this.innerBody.querySelector("#login");
    const passwordInput = this.innerBody.querySelector("#password");
    const loginButton = this.innerBody.querySelector("#submit-login");
    const closeButton = this.innerBody.querySelector(".close");

    loginButton.onclick = () => {
      const user = queries.loginUser(loginInput.value, passwordInput.value);
      if (!user) {
        infoText.innerHTML = "Wrong login or password";
      } else {
        dispatch(store.loggedUser, new User(user));
        this.close();
      }
    };

    closeButton.onclick = () => {
      this.close();
    };
  }
}

class RegisterModal extends Modal {
  render() {
    this.innerBody.innerHTML = `
          <h2>Register</h2>
          <h3 class='red'></h3>
          <input type='text' id='login' placeholder='Login...'></input>
          <input type='text' id='name' placeholder='Name...'></input>
          <input type='password' id='password' placeholder='Password...'></input>
          <input type='password' id='password-repeat' placeholder='Confirm password...'></input>
          <input type='checkbox' id='isAuthor'></input>
          <p>Is user an author?</p>
          <div class='bottom-buttons'>
              <button id='submit-register'>Register</button>
              <button class='close'>Cancel</button>
          </div>
      `;
    const infoText = this.innerBody.querySelector("h3");
    const loginInput = this.innerBody.querySelector("#login");
    const nameInput = this.innerBody.querySelector("#name");
    const passwordInput = this.innerBody.querySelector("#password");
    const confirmPassword = this.innerBody.querySelector("#password-repeat");
    const registerButton = this.innerBody.querySelector("#submit-register");
    const isAuthor = this.innerBody.querySelector("#isAuthor");
    const closeButton = this.innerBody.querySelector(".close");

    registerButton.onclick = () => {
      if (passwordInput.value !== confirmPassword.value) {
        infoText.innerHTML = "Password fields must contain the same value";
        return;
      }
      if (
        !new RegExp(/^[a-z0-9]+$/i).test(
          loginInput.value + passwordInput.value + confirmPassword.value
        )
      ) {
        infoText.innerHTML =
          "Only alphanumeric characters are allowed in login and password";
        return;
      }
      queries.registerUser(
        loginInput.value,
        passwordInput.value,
        nameInput.value,
        isAuthor.checked
      );
      this.close();
      new LoginModal();
    };

    closeButton.onclick = () => {
      this.close();
    };
  }
}

class ArticleModal extends Modal {
  render() {
    this.innerBody.classList.add("article");
    this.innerBody.innerHTML = `
        <h2>Create Article</h2>
        <h3 class='red'></h3>
        <input type='text' id='title' placeholder='Title...'></input>
        <input type='text' id='description' placeholder='Description...'></input>
        <div class='paragraphs'></div>
        <input type='text' class='tags' placeholder='Tags... (comma separated)'></input>
        <div class='bottom-buttons'>
            <button id='submit-article'>Send</button>
            <button class='close'>Cancel</button>
        </div>
    `;

    const infoText = this.innerBody.querySelector("h3");
    const titleInput = this.innerBody.querySelector("#title");
    const descriptionInput = this.innerBody.querySelector("#description");
    const submitButton = this.innerBody.querySelector("#submit-article");
    const closeButton = this.innerBody.querySelector(".close");

    this.tagsBox = this.innerBody.querySelector(".tags");
    this.paragraphsBox = this.innerBody.querySelector(".paragraphs");
    this.paragraphs = [];
    this.createParagraph();

    submitButton.onclick = () => {
      const article = store.loggedUser.state.createArticle({
        title: titleInput.value,
        description: descriptionInput.value,
        content: this.paragraphs,
        date: new Date(Date.now()),
        tags: this.tagsBox.value.replaceAll(" ", "").split(","),
      });
      queries.createArticle(article);
      this.close();
      dispatch(store.newArticles, article);
    };

    closeButton.onclick = () => {
      this.close();
    };
  }

  createParagraph() {
    this.paragraphs.push({ header: "", paragraph: "" });
    this.renderParagraphs();
  }

  renderParagraphs() {
    this.paragraphsBox.innerHTML = "";
    this.paragraphs.map((paragraph) => {
      const header = document.createElement("input");
      header.placeholder = "Paragraph header...";
      const script = document.createElement("textarea");
      script.placeholder = "Script...";
      const removeParagraph = document.createElement("button");
      removeParagraph.classList.add("remove-button");
      removeParagraph.innerHTML = "Remove paragraph";
      removeParagraph.onclick = () => {
        this.removeParagraph(paragraph);
      };
      header.value = paragraph.header;
      script.value = paragraph.paragraph;
      header.onchange = (e) => {
        paragraph.header = e.target.value;
      };
      script.onchange = (e) => {
        paragraph.paragraph = e.target.value;
      };
      this.paragraphsBox.append(...[header, script]);
      if (this.paragraphs.length > 1) {
        this.paragraphsBox.append(removeParagraph);
      }
    });
    const newParagraph = document.createElement("button");
    newParagraph.classList.add("new-button");
    newParagraph.innerHTML = "New paragraph";
    newParagraph.onclick = () => {
      this.createParagraph();
    };
    this.paragraphsBox.append(newParagraph);
  }

  removeParagraph(paragraph) {
    this.paragraphs = this.paragraphs.filter(
      (existed) => existed !== paragraph
    );
    this.renderParagraphs();
  }
}
