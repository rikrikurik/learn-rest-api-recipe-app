from cmath import cos
from curses.ascii import TAB
from boto3.dynamodb.conditions import Key, Attr
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

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']

# Create dynamodb client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)


def getItem(id):
    # get item
    options = {
        'Select': 'ALL_ATTRIBUTES',
        'KeyConditionExpression': Key('id').eq(id),
    }
    response = table.query(**options)
    item = response['Items']
    logging.info(f"{item=}")
    return item


def handler(event, context):
    try:
        # get item id from path parameters
        id = event['pathParameters']['id']
        item = getItem(id=id)

    except Exception as err:
        # error
        logger.error('Function exception: %s', err)
        traceback.print_exc()
        logger.error('Failed to get item')
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
            },
            'body': json.dumps({
                "message": "Failed to get item!",
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
            "message": "Recipe details by id",
            "recipe": item
        }),
    }
