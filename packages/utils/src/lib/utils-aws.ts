import { AttributeMap, AttributeValue, QueryInput, ExpressionAttributeValueMap } from 'aws-sdk/clients/dynamodb';

class AWSAttributeMapAdapter {
	static toAttributeValue(value: any): AttributeValue {
		switch (typeof value) {
			case 'string':
				return { S: value };
			case 'number':
				return { N: `${value}` };
			case 'object':
				if (Array.isArray(value) && value.length > 0) {
					switch (typeof value[0]) {
						case 'string': return { SS: value };
						case 'number': return { NS: value.map(n => `${n}`) };
					}
				}
		}
	}

	static fromAttributeValue(value: AttributeValue): any {
		if (value == null) return null;

		const type = Object.keys(value)[0];
		switch (type) {
			case 'S':
			case 'SS':
				return value[type];
			case 'N': return parseInt(value[type]);
			case 'NS': return value[type].map(n => parseInt(n));
		}
	}
}

export const toAWSAttributeMap = <T extends object>(obj: T): AttributeMap => {
	if (obj == null) return null;

	const attributeMap = {};

	Object.keys(obj).forEach((key) => {
		const value = AWSAttributeMapAdapter.toAttributeValue(obj[key]);
		if (value) {
			attributeMap[key] = value;
		}
	});

	return attributeMap;
};

export const fromAWSAttributeMap = <T extends object>(attributeMap: AttributeMap): T => {
	if (attributeMap == null) return null;

	const result = {};

	Object.keys(attributeMap).forEach((key) => {
		const value = AWSAttributeMapAdapter.fromAttributeValue(attributeMap[key]);
		if (value) {
			result[key] = value;
		}
	});

	return result as T;
};

export const toSimpleAWSKeyConditionExpressions = (values: object): Partial<QueryInput> => {
	const colonValues = {};
	Object.keys(values).forEach((k) => {
		const keyColon = k.charAt(0) !== ':' ? `:${k}` : k;
		colonValues[keyColon] = values[k];
	});

	const expressionValues: ExpressionAttributeValueMap = toAWSAttributeMap(colonValues);
	const condition = Object.keys(values).map(k => `${k} = :${k}`).join(', ');

	return {
		KeyConditionExpression: condition,
		ExpressionAttributeValues: expressionValues,
	};
}