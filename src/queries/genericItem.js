import gql from 'graphql-tag';

export const GET_GENERIC_ITEMS = gql`
  query GenericItems(
    $ids: [ID]
    $limit: Int
    $offset: Int
    $dataProvider: String
    $categoryId: ID
    $genericType: String
  ) {
    genericItems(
      ids: $ids
      limit: $limit
      skip: $offset
      dataProvider: $dataProvider
      categoryId: $categoryId
      genericType: $genericType
    ) {
      id
      createdAt
      genericType
      title
      externalId
      categories {
        id
        name
      }
      companies {
        id
        name
        address {
          id
          addition
          street
          zip
          city
          geoLocation {
            id
            latitude
            longitude
          }
        }
        contact {
          id
          firstName
          lastName
          phone
          email
          webUrls {
            id
            url
            description
          }
        }
      }
      contacts {
        id
        firstName
        lastName
        phone
        email
        webUrls {
          id
          url
          description
        }
      }
      contentBlocks {
        id
        body
        title
        mediaContents {
          id
          contentType
          sourceUrl {
            id
            url
          }
          captionText
        }
      }
      dataProvider {
        id
        logo {
          id
          url
        }
        name
        dataType
      }
      mediaContents {
        id
        captionText
        contentType
        copyright
        sourceUrl {
          id
          url
        }
      }
      dates {
        id
        dateEnd
        dateStart
      }
      publicationDate
      payload
    }
  }
`;

export const GET_GENERIC_ITEM = gql`
  query GenericItem($id: ID!) {
    genericItem(id: $id) {
      id
      createdAt
      genericType
      title
      externalId
      companies {
        id
        name
        address {
          id
          addition
          street
          zip
          city
          geoLocation {
            id
            latitude
            longitude
          }
        }
        contact {
          id
          firstName
          lastName
          phone
          email
          webUrls {
            id
            url
            description
          }
        }
      }
      contacts {
        id
        firstName
        lastName
        phone
        email
        webUrls {
          id
          url
          description
        }
      }
      contentBlocks {
        id
        body
        title
        mediaContents {
          id
          contentType
          sourceUrl {
            id
            url
          }
          captionText
        }
      }
      dataProvider {
        id
        logo {
          id
          url
        }
        name
        dataType
      }
      mediaContents {
        id
        captionText
        contentType
        copyright
        sourceUrl {
          id
          url
        }
      }
      dates {
        id
        dateEnd
        dateStart
      }
      publicationDate
      payload
    }
  }
`;

export const CREATE_GENERIC_ITEM = gql`
  mutation createGenericItem(
    $categoryName: String
    $contacts: [ContactInput!]
    $contentBlocks: [ContentBlockInput!]
    $dates: [DateInput!]
    $genericType: String
    $publishedAt: String
    $title: String
  ) {
    createGenericItem(
      categoryName: $categoryName
      contacts: $contacts
      contentBlocks: $contentBlocks
      dates: $dates
      genericType: $genericType
      publishedAt: $publishedAt
      title: $title
    ) {
      id
    }
  }
`;

export const CREATE_GENERIC_ITEM_MESSAGE = gql`
  mutation createGenericItemMessage(
    $genericItemId: ID!
    $name: String!
    $email: String!
    $phoneNumber: String
    $message: String!
    $termsOfService: Boolean!
  ) {
    messageGenericItem(
      genericItemId: $genericItemId
      name: $name
      email: $email
      phoneNumber: $phoneNumber
      message: $message
      termsOfService: $termsOfService
    ) {
      statusCode
    }
  }
`;
