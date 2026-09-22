def divide(dividend: float, divisor: float) -> float:
    if divisor == 0:
        raise ValueError("divisor must not be zero")
    return dividend / divisor
