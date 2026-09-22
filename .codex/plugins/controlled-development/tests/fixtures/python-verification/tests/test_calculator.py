import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from calculator import divide


class DivideTests(unittest.TestCase):
    def test_divides_numbers(self):
        self.assertEqual(divide(9, 3), 3)

    def test_rejects_zero_divisor(self):
        with self.assertRaisesRegex(ValueError, "divisor must not be zero"):
            divide(4, 0)


if __name__ == "__main__":
    unittest.main()
