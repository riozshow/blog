"use-strict";

const store = {
  selectedMonthTab: { state: null, observers: [] },
  selectedArticle: { state: null, observers: [] },
  newComments: { state: null, observers: [] },
  newArticles: { state: null, observers: [] },
  loggedUser: { state: null, observers: [] },
};

const dispatch = (storeProperty, state) => {
  if (!storeProperty || typeof storeProperty !== "object" || !storeProperty.observers) {
    throw new Error("Wrong store property");
  }
  storeProperty.state = state;
  storeProperty.observers.map((observer) => observer());
};

const observe = (storeProperty, dispatch) => {
  if (
    typeof storeProperty !== "object" &&
    storeProperty.observers &&
    typeof storeProperty.observers === "object"
  ) {
    throw new Error("Wrong store propery");
  }
  if (typeof dispatch !== "function") {
    throw new Error("Dispatch property is not a function");
  }
  storeProperty.observers.push(dispatch);
};
