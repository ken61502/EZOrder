#include <iostream>
#include <string>

using namespace std;

int main() {
	int num;
	cin >> num;
	cout << '[';
	for (int i = 0; i < num; i++) {
		string label, priceM, priceL;
		cin >> label >> priceM >> priceL;
		if (i < num - 1) {
			cout << "{label:\'" << label << "\',price:{\'M\':" << priceM << ",\'L\':" << priceL << "}},\n";
		}
		else {
			cout << "{label:\'" << label << "\',price:{\'M\':" << priceM << ",\'L\':" << priceL << "}}";
		}
	}
	cout << ']';
	return 0;
}