import logging
import sys
from app.config import settings

# ANSI color codes for Cyberpunk Terminal logging
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
RESET = "\033[0m"
BOLD = "\033[1m"


class CyberLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        level_colors = {
            logging.DEBUG: MAGENTA,
            logging.INFO: CYAN,
            logging.WARNING: YELLOW,
            logging.ERROR: RED,
            logging.CRITICAL: BOLD + RED,
        }
        color = level_colors.get(record.levelno, RESET)
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        prefix = f"{color}[NULL//ROOT]{RESET} [{timestamp}] [{color}{record.levelname:<8}{RESET}]"
        return f"{prefix} [{record.name}] {record.getMessage()}"


def setup_logger(name: str = "null_root") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(CyberLogFormatter())
        logger.addHandler(handler)

    logger.propagate = False
    return logger


logger = setup_logger()
