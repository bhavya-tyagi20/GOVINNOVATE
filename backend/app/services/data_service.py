from pathlib import Path
import pandas as pd


DATA_FOLDER = Path(__file__).resolve().parent.parent / "data"


def load_data(filename):
    file_path = DATA_FOLDER / filename

    if not file_path.exists():
        raise FileNotFoundError(
            f"Dataset file not found: {file_path}"
        )

    return pd.read_csv(file_path)


def get_departments():
    return load_data("departments.csv")


def get_challenges():
    return load_data("challenges.csv")


def get_requirements():
    return load_data("challenge_requirements.csv")


def get_startups():
    return load_data("startups.csv")


def get_applications():
    return load_data("applications.csv")


def get_evaluations():
    return load_data("evaluations.csv")


def get_pilots():
    return load_data("pilots.csv")


def get_pilot_metrics():
    return load_data("pilot_metrics.csv")


def get_milestones():
    return load_data("milestones.csv")


def get_validations():
    return load_data("validations.csv")


def get_procurement_decisions():
    return load_data("procurement_decisions.csv")


def get_scaleups():
    return load_data("scaleups.csv")