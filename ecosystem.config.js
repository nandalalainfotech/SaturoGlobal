module.exports = {
    apps: [{
            name: "SaturoGlobal",
            script: "server.js",
            watch: false,
            ignore_watch: ["node_modules"],
            // new feature; increase restart delay each time after every crash or non reachable db per example
            exp_backoff_restart_delay: 100,
            out_file: "logs/out.log",
            error_file: "logs/err.log",

            instance_var: '0',
            env: {
                "PORT": 8000,
                "NODE_ENV": "prod"
            },

            instances: 5, // can be max or any number of processes the cpu can handle
            exec_mode: "cluster"
        }
    ]
};