let validBranches = [];

let branches = process.argv
	.slice(2)
	.filter((branch) => {
		return (
			!branch.includes('*') &&
			!branch.includes('->') &&
			!branch.includes('HEAD')
		);
	})
	.map((branch) => {
		return branch.replace('origin/', '').replace('remotes/', '');
	})
	.forEach((branch) => {
		if (!validBranches.includes(branch)) {
			validBranches.push(branch);
		}
	});

console.log(validBranches.join('\n'));
