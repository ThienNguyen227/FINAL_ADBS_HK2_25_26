export const login = (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "admin@gmail.com" && password === "123456") {
        resolve({ token: "fake-token" });
      } else {
        reject("Error");
      }
    }, 1000);
  });
};