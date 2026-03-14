import initApp from "./app";
import config from "./config";

initApp().then((app) => {
    app.listen(config.PORT, () => {
        console.log(`Server running on ${config.DOMAIN_BASE}`);
    });
});
