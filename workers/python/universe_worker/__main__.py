"""CLI entrypoint for `python -m universe_worker`."""

from .protocol import WorkerServer


def main() -> None:
    WorkerServer().serve_forever()


if __name__ == "__main__":
    main()
