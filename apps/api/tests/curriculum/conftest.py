"""Shared fixtures for curriculum tests.

Broken fixtures are made from a minimal valid Day 1 built in DAY_ONE_DATA: each
test copies it, breaks one thing, and writes the result to a temporary content
directory. It holds one exercise of every kind so the rule tests cover them all.
"""

from collections.abc import Callable
from copy import deepcopy
from pathlib import Path
from typing import Any

import pytest
import yaml

REPO_ROOT = Path(__file__).resolve().parents[4]
CONTENT_DAYS = REPO_ROOT / "content" / "days"

WriteDay = Callable[..., Path]

DAY_ONE_DATA: dict[str, Any] = {
    "day": 1,
    "title": 'Greetings and the verb "be"',
    "vocabulary": [
        {
            "word": "brother",
            "definition": "a boy or man who has the same parents as you",
            "example": "My brother is taller than me.",
            "audio_ref": "d01-vocab-brother",
        },
    ],
    "screens": [
        {
            "kind": "text",
            "id": "d01-screen-be",
            "title": 'The verb "be" in the present',
            "cards": [
                {
                    "title": 'Three forms of "be"',
                    "body": 'The verb "be" has three present forms, am, is and are.',
                    "examples": ["I am a cook.", "She is my neighbour."],
                    "watch_out": 'Do not say "I are".',
                },
            ],
        },
        {
            "kind": "test",
            "id": "d01-test-be",
            "title": 'Test 1: Forms of "be"',
            "intro": 'Choose the correct form of "be".',
            "items": [
                {
                    "id": "d01-grammar-mc-01",
                    "type": "multiple_choice",
                    "difficulty": 1,
                    "learning_area": "Grammar",
                    "origin": "original",
                    "topics": ["grammar.be.present"],
                    "points": 1,
                    "prompt": "Choose the correct word: ___ you ready for the lesson?",
                    "choices": ["Am", "Is", "Are"],
                    "answer": "Are",
                    "explanation": 'Use "are" with "you".',
                },
                {
                    "id": "d01-grammar-fill-01",
                    "type": "fill_blank",
                    "difficulty": 1,
                    "learning_area": "Grammar",
                    "origin": "original",
                    "topics": ["grammar.be.present"],
                    "points": 1,
                    "prompt": "Fill in the blank: My cousin ___ twelve years old.",
                    "accepted": ["is"],
                    "explanation": '"My cousin" is one person, so the form is "is".',
                },
                {
                    "id": "d01-grammar-mc-02",
                    "type": "multiple_choice",
                    "difficulty": 1,
                    "learning_area": "Grammar",
                    "origin": "original",
                    "topics": ["grammar.be.negative"],
                    "points": 1,
                    "prompt": "Which sentence is correct?",
                    "choices": ["He not is tired.", "He is not tired.", "He is no tired."],
                    "answer": "He is not tired.",
                    "explanation": 'Put "not" after the verb, as in "is not".',
                },
                {
                    "id": "d01-listening-mc-01",
                    "type": "listening_comprehension",
                    "difficulty": 1,
                    "learning_area": "Listening",
                    "origin": "original",
                    "topics": ["listening.detail"],
                    "points": 1,
                    "prompt": "Listen, then choose the answer: Where is Maria from?",
                    "audio_text": "Hello, my name is Maria. I am from Spain, and I am a nurse.",
                    "choices": ["Italy", "Spain", "Portugal"],
                    "answer": "Spain",
                    "explanation": 'Maria says "I am from Spain."',
                },
                {
                    "id": "d01-pronunciation-01",
                    "type": "pronunciation_practice",
                    "difficulty": 1,
                    "learning_area": "Pronunciation",
                    "origin": "original",
                    "topics": ["pronunciation.vowel_length"],
                    "points": 1,
                    "prompt": "Listen, then choose the sentence you hear.",
                    "audio_text": "I have a sheep.",
                    "choices": ["I have a ship.", "I have a sheep."],
                    "answer": "I have a sheep.",
                    "explanation": '"Sheep" has a long vowel, as in "see".',
                },
                {
                    "id": "d01-pronunciation-self-01",
                    "type": "pronunciation_self_rating",
                    "difficulty": 1,
                    "learning_area": "Pronunciation",
                    "origin": "original",
                    "topics": ["pronunciation.vowel_length"],
                    "prompt": (
                        "Listen, say the sentence aloud, then rate how well you said the vowels."
                    ),
                    "audio_text": "Please sit in the seat.",
                    "explanation": "Listen again, then rate your own answer.",
                },
                {
                    "id": "d01-vocabulary-match-01",
                    "type": "vocabulary_matching",
                    "difficulty": 1,
                    "learning_area": "Vocabulary",
                    "origin": "original",
                    "topics": ["vocabulary.family_and_people"],
                    "points": 4,
                    "prompt": "Match each word with its meaning.",
                    "pairs": [
                        {
                            "word": "brother",
                            "meaning": "a boy or man who has the same parents as you",
                        },
                        {"word": "neighbour", "meaning": "a person who lives near your home"},
                        {"word": "grandmother", "meaning": "the mother of your mother or father"},
                        {"word": "friend", "meaning": "a person you like and spend time with"},
                    ],
                    "explanation": "Each word names a person in your life.",
                },
                {
                    "id": "d01-sentence-order-01",
                    "type": "sentence_ordering",
                    "difficulty": 1,
                    "learning_area": "Sentence construction",
                    "origin": "original",
                    "topics": ["sentence.word_order.basic_clause"],
                    "points": 1,
                    "prompt": "Put the words in the correct order to make one sentence.",
                    "tokens": ["a", "is", "doctor.", "brother", "My"],
                    "answer": ["My", "brother", "is", "a", "doctor."],
                    "explanation": 'Start with the subject, "My brother".',
                },
                {
                    "id": "d01-spelling-01",
                    "type": "spelling_correction",
                    "difficulty": 1,
                    "learning_area": "Spelling",
                    "origin": "original",
                    "topics": ["spelling.double_letters"],
                    "points": 1,
                    "prompt": (
                        "One word is misspelled. Retype the whole sentence with the word fixed."
                    ),
                    "text": "We drink cofee in the morning.",
                    "accepted": ["We drink coffee in the morning."],
                    "explanation": "\"Coffee\" has two f's and two e's.",
                },
                {
                    "id": "d01-self-check-01",
                    "type": "self_check",
                    "difficulty": 1,
                    "learning_area": "Grammar",
                    "origin": "original",
                    "topics": ["grammar.word_choice"],
                    "prompt": "I has two books.",
                    "explanation": "Say I have two books.",
                },
            ],
        },
    ],
}


@pytest.fixture
def day_one_data() -> dict[str, Any]:
    return deepcopy(DAY_ONE_DATA)


@pytest.fixture
def content_dir(tmp_path: Path) -> Path:
    directory = tmp_path / "days"
    directory.mkdir()
    return directory


@pytest.fixture
def write_day(content_dir: Path) -> WriteDay:
    """Write `data` as YAML into the temporary content directory."""

    def write(data: Any, name: str = "day-01.yaml") -> Path:
        path = content_dir / name
        path.write_text(
            yaml.safe_dump(data, sort_keys=False, allow_unicode=True),
            encoding="utf-8",
        )
        return path

    return write
