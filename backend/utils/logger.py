import logging
import sys
from typing import Optional


def setup_logging(
    level: int = logging.INFO,
    format_string: Optional[str] = None,
) -> None:
    """Configure application logging with a standard format."""
    if format_string is None:
        format_string = "%(asctime)s | BLOCK_HASH: %(process)d | %(levelname)s | %(name)s | %(message)s"

    logging.basicConfig(
        level=level,
        format=format_string,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )


def get_logger(name: str) -> logging.Logger:
    """Return a logger instance for the given module name."""
    return logging.getLogger(name)
