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

# Create dynamodb and ssm client
dynamo_client = boto3.client('dynamodb')
ssm_client = boto3.client('ssm')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
COUNTER_NAME = os.environ['COUNTER_NAME']


def get_current_id_counter():
    response = ssm_client.get_parameters(
        Names=[
            COUNTER_NAME,
        ],
        WithDecryption=True
    )
    return int(response['Parameters'][0]['Value'])


def set_incremented_counter(incremented_counter):
    response = ssm_client.put_parameter(
        Name=COUNTER_NAME,
        Value=str(incremented_counter),
        Overwrite=True
    )


def createNewItem(title: str, making_time: str, serves: str,
                  ingredients: str, cost: int):
    # increment id
    current_counter = get_current_id_counter()
    id = current_counter + 1

    # set create date and update date
    created_datetime = datetime.datetime.now()
    created_at = created_datetime.strftime('%Y-%m-%d %H:%M:%S')
    updated_at = created_at
    # put item
    response = dynamo_client.put_item(
        TableName=TABLE_NAME,
        Item={
            "id": {"S": str(id)},
            "title": {"S": title},
            "making_time": {"S": making_time},
            "serves": {"S": serves},
            "ingredients": {"S": ingredients},
            "cost": {"S": str(cost)},
            "created_at": {"S": created_at},
            "updated_at": {"S": updated_at},
        },
    )
    logging.info(f"{response=}")
    return id, created_at, updated_at


def handler(event, context):
    # Print received event
    logger.info(f"{event=}")
    try:
        # get item info from event
        item_data = json.loads(event['body'])
        logger.info(f"{item_data=}")
        title = item_data['title']
        making_time = item_data['making_time']
        serves = item_data['serves']
        ingredients = item_data['ingredients']
        cost = item_data['cost']
        # create new item to the table
        id, created_at, updated_at = createNewItem(
            title=title, making_time=making_time,
            serves=serves, ingredients=ingredients,
            cost=cost)

    except Exception as err:
        # error
        logger.error('Function exception: %s', err)
        traceback.print_exc()
        logger.error('Failed to create new item')
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
            },
            'body': json.dumps({
                "message": "Recipe creation failed!",
                "required": "title, making_time, serves, ingredients, cost"
            }),
        }

    # suceeded
    logger.info(f"New item created. {id=}, {created_at=}, {updated_at=}")
    # if succeeded, update increment counter
    set_incremented_counter(id)
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
        },
        'body': json.dumps({
            "message": "Recipe successfully created!",
            "recipe": [
                {
                    "id": id,
                    "title": title,
                    "making_time": making_time,
                    "serves": serves,
                    "ingredients": ingredients,
                    "cost": cost,
                    "created_at": created_at,
                    "updated_at": updated_at
                }
            ]
        }),
    }
