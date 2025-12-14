const validatePhone = (number) => {
    if (typeof number !== 'string' || !/^\d{6}$/.test(number)) {
        return { isValid: false };
    }

    const d = number.split('').map(Number);

    const hasNonZeroDigit = d.some(x => x !== 0);
    const sumFirstEqualsLast = (d[0]+d[1]+d[2]) === (d[3]+d[4]+d[5]);
    const sumOddEqualsEven = (d[0]+d[2]+d[4]) === (d[1]+d[3]+d[5]);

    return {
        number,
        rules: { hasNonZeroDigit, sumFirstEqualsLast, sumOddEqualsEven },
        isValid: hasNonZeroDigit && sumFirstEqualsLast && sumOddEqualsEven
    };
};

const countValidNumbers = () => {
    let count = 0;
    for (let i = 0; i < 1000000; i++) {
        if (validatePhone(i.toString().padStart(6, '0')).isValid) {
            count++;
        }
    }
    return count;
};

module.exports = { validatePhone, countValidNumbers };
