from cmath import cos
import boto3
import logging
import datetime
import json
import os
import traceback

# Create logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)
# logger.setLevel(logging.ERROR)

# Create dynamodb client
dynamo_client = boto3.client('dynamodb')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']


def deleteItem(id: str):
    dynamo_client.delete_item(
        TableName=TABLE_NAME,
        Key={
            "id": {"S": id},
        },
        ConditionExpression='attribute_exists(id)'
    )


def handler(event, context):
    # Print received event
    logger.info(f"{event=}")
    try:
        # get item id from path parameters
        id = event['pathParameters']['id']
        # delete item
        deleteItem(id=id)

    except Exception as err:
        # error
        logger.error('Function exception: %s', err)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
            },
            'body': json.dumps({
                "message": "No Recipe found"
            }),
        }

    # suceeded
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
        },
        'body': json.dumps({
            "message": "Recipe successfully removed!"
        }),
    }
