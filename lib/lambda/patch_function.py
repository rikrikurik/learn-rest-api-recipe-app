import boto3
import logging
import json
import os

# Create logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)
# logger.setLevel(logging.ERROR)

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']

# Create dynamodb client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)


def updateItem(id: str, new_title, new_making_time, new_serves, new_ingredients, new_cost):
    response = table.update_item(
        Key={
            "id": id,
        },
        UpdateExpression="set title=:t, making_time=:m, serves=:s, ingredients=:i, cost=:c",
        ExpressionAttributeValues={
            ':t': new_title,
            ':m': new_making_time,
            ':s': new_serves,
            ':i': new_ingredients,
            ':c': new_cost
        },
        ConditionExpression='attribute_exists(id)'
    )
    logger.info(f"{response=}")
    return response


def handler(event, context):
    # Print received event
    logger.info(f"{event=}")
    try:
        # get item id from path parameters
        id = event['pathParameters']['id']
        # get item info from event
        item_data = json.loads(event['body'])
        new_title = item_data['title']
        new_making_time = item_data['making_time']
        new_serves = item_data['serves']
        new_ingredients = item_data['ingredients']
        new_cost = item_data['cost']
        # update item
        updated_item = updateItem(
            id=id, new_title=new_title, new_making_time=new_making_time,
            new_serves=new_serves, new_ingredients=new_ingredients,
            new_cost=new_cost
        )

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
    logger.info(f"Item updated. {id=}")
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
        },
        'body': json.dumps({
            "message": "Recipe successfully updated!",
            "recipe": [
                {
                    "title": new_title,
                    "making_time": new_making_time,
                    "serves": new_serves,
                    "ingredients": new_ingredients,
                    "cost": new_cost,
                }
            ]
        }),
    }
