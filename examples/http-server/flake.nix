{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    process-compose-flake.url = "github:Platonic-Systems/process-compose-flake";
    services-flake.url = "github:juspay/services-flake";
  };
  outputs = inputs @ {flake-parts, ...}:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = inputs.nixpkgs.lib.systems.flakeExposed;
      imports = [
        inputs.process-compose-flake.flakeModule
      ];
      perSystem = {pkgs, ...}: {
        devShells.default = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            corepack
            nodejs_22
          ];
        };

        process-compose."default" = {config, ...}: {
          imports = [
            inputs.services-flake.processComposeModules.default
          ];

          services.tempo.tempo.enable = true;
          services.grafana.grafana = {
            enable = true;
            http_port = 4000;
            extraConf = {
              "auth.anonymous" = {
                enabled = true;
                org_role = "Editor";
              };
            };
            datasources = with config.services.tempo.tempo; [
              {
                name = "Tempo";
                type = "tempo";
                access = "proxy";
                url = "http://${httpAddress}:${builtins.toString httpPort}";
              }
            ];
          };
          services.redis.redis.enable = true;
          settings.processes.tsx = {
            command = "pnpm dev";
          };
        };
      };
    };
}
