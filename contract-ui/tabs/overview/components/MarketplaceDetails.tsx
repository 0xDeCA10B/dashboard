import {
  ListingStats,
  ListingStatsV3,
} from "../../listings/components/listing-stats";
import {
  AspectRatio,
  Flex,
  GridItem,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  useContract,
  useDirectListings,
  useEnglishAuctions,
  useListings,
} from "@thirdweb-dev/react";
import {
  AuctionListing,
  DirectListing,
  DirectListingV3,
  EnglishAuction,
  ListingType,
  Marketplace,
  MarketplaceV3,
} from "@thirdweb-dev/sdk";
import { useTabHref } from "contract-ui/utils";
import { BigNumber } from "ethers";
import { useMemo } from "react";
import {
  Badge,
  Card,
  Heading,
  Text,
  TrackedLink,
  TrackedLinkProps,
} from "tw-components";
import { AddressCopyButton } from "tw-components/AddressCopyButton";
import { NFTMediaWithEmptyState } from "tw-components/nft-media";

type Listing = DirectListing | AuctionListing;
type ListingV3 = DirectListingV3 | EnglishAuction;

type ListingData = {
  asset: Listing["asset"] | ListingV3["asset"];
  type: "direct-listing" | "english-auction";
  sellerAddress: Listing["sellerAddress"] | ListingV3["creatorAddress"];
  currencyValue:
    | Listing["buyoutCurrencyValuePerToken"]
    | DirectListingV3["currencyValuePerToken"]
    | EnglishAuction["buyoutCurrencyValue"];
};

type MarketplaceDetailsProps = {
  contractAddress: string;
  contractType: "marketplace" | "marketplace-v3";
  trackingCategory: TrackedLinkProps["category"];
};

interface MarketplaceDetailsVersionProps<T> {
  contract: T;
  trackingCategory: TrackedLinkProps["category"];
}

export const MarketplaceDetails: React.FC<MarketplaceDetailsProps> = ({
  contractAddress,
  contractType,
  trackingCategory,
}) => {
  const { contract } = useContract(contractAddress, contractType);

  if (contractType === "marketplace" && contract) {
    return (
      <MarketplaceV1Details
        contract={contract as Marketplace}
        trackingCategory={trackingCategory}
      />
    );
  } else if (contractType === "marketplace-v3" && contract) {
    return (
      <MarketplaceV3Details
        contract={contract as MarketplaceV3}
        trackingCategory={trackingCategory}
      />
    );
  } else {
    return null;
  }
};

const MarketplaceV1Details: React.FC<
  MarketplaceDetailsVersionProps<Marketplace>
> = ({ contract, trackingCategory }) => {
  const listingsHref = useTabHref("listings");
  const listingsQuery = useListings(contract, { count: 3 });

  const listings = useMemo(
    () =>
      listingsQuery?.data?.map<ListingData>((v) => ({
        ...v,
        type:
          v.type === ListingType.Direct ? "direct-listing" : "english-auction",
        currencyValue: v.buyoutCurrencyValuePerToken,
      })) || [],
    [listingsQuery?.data],
  );

  return (
    <Flex gap={6} flexDirection="column">
      <Heading size="title.sm">Listings</Heading>
      <ListingStats contract={contract} />
      <Flex direction="column" gap={{ base: 3, md: 6 }}>
        <Flex align="center" justify="space-between" w="full">
          <Heading size="label.lg">Recent Listings</Heading>
          <TrackedLink
            category={trackingCategory}
            label="view_all_listings"
            color="blue.400"
            _light={{
              color: "blue.600",
            }}
            gap={4}
            href={listingsHref}
          >
            View listings -&gt;
          </TrackedLink>
        </Flex>
      </Flex>
      <ListingCards
        listings={listings}
        isLoading={listingsQuery.isLoading}
        trackingCategory={trackingCategory}
      />
    </Flex>
  );
};

const MarketplaceV3Details: React.FC<
  MarketplaceDetailsVersionProps<MarketplaceV3>
> = ({ contract, trackingCategory }) => {
  const directListingsHref = useTabHref("direct-listings");
  const englishAuctionsHref = useTabHref("english-auctions");
  const directListingsQuery = useDirectListings(contract, { count: 3 });
  const englishAuctionsQuery = useEnglishAuctions(contract, { count: 3 });

  const directListings = useMemo(
    () =>
      directListingsQuery?.data?.map<ListingData>((v) => ({
        ...v,
        sellerAddress: v.creatorAddress,
        type: "direct-listing",
        currencyValue: v.currencyValuePerToken,
      })) || [],
    [directListingsQuery?.data],
  );

  const englishAuctions = useMemo(
    () =>
      englishAuctionsQuery?.data?.map<ListingData>((v) => ({
        ...v,
        sellerAddress: v.creatorAddress,
        type: "english-auction",
        currencyValue: v.buyoutCurrencyValue,
      })) || [],
    [englishAuctionsQuery?.data],
  );

  return (
    <Flex gap={6} flexDirection="column">
      <Heading size="title.sm">Listings</Heading>
      <ListingStatsV3 contract={contract} />
      {!directListingsQuery.isLoading && directListings.length === 0 ? null : (
        <>
          <Flex align="center" justify="space-between" w="full">
            <Heading size="label.lg">Direct Listings</Heading>
            <TrackedLink
              category={trackingCategory}
              label="view_all_direct_listings"
              color="blue.400"
              _light={{
                color: "blue.600",
              }}
              gap={4}
              href={directListingsHref}
            >
              View direct listings -&gt;
            </TrackedLink>
          </Flex>
          <ListingCards
            listings={directListings}
            isLoading={directListingsQuery.isLoading}
            trackingCategory={trackingCategory}
            isMarketplaceV3
          />
        </>
      )}
      {!englishAuctionsQuery.isLoading &&
      englishAuctions.length === 0 ? null : (
        <>
          <Flex align="center" justify="space-between" w="full">
            <Heading size="label.lg">English Auctions</Heading>
            <TrackedLink
              category={trackingCategory}
              label="view_all_english_auctions"
              color="blue.400"
              _light={{
                color: "blue.600",
              }}
              gap={4}
              href={englishAuctionsHref}
            >
              View english auctions -&gt;
            </TrackedLink>
          </Flex>
          <ListingCards
            listings={englishAuctions}
            isLoading={englishAuctionsQuery.isLoading}
            trackingCategory={trackingCategory}
            isMarketplaceV3
          />
        </>
      )}
    </Flex>
  );
};

const dummyMetadata: (idx: number) => ListingData = (idx) => ({
  asset: {
    name: "Loading...",
    description: "lorem ipsum loading sit amet",
    id: `${idx}`,
    uri: "",
  },
  sellerAddress: `0x_fake_${idx}`,
  type: idx % 2 === 0 ? "direct-listing" : "english-auction",
  currencyValue: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    value: BigNumber.from("0"),
    displayValue: "0",
  },
  startTimeInSeconds: BigNumber.from(idx),
});

interface ListingCardsProps {
  listings: ListingData[];
  isLoading: boolean;
  trackingCategory: TrackedLinkProps["category"];
  isMarketplaceV3?: boolean;
}
const ListingCards: React.FC<ListingCardsProps> = ({
  listings,
  isLoading,
  isMarketplaceV3,
  trackingCategory,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  listings = isLoading
    ? Array.from({ length: isMobile ? 2 : 3 }).map((_, idx) =>
        dummyMetadata(idx),
      )
    : listings.slice(0, isMobile ? 2 : 3);

  const listingsHref = useTabHref("listings");
  const directListingsHref = useTabHref("direct-listings");
  const englishAuctionsHref = useTabHref("english-auctions");

  return (
    <SimpleGrid gap={{ base: 3, md: 6 }} columns={{ base: 2, md: 3 }}>
      {listings.map((listing, index) => (
        <GridItem
          key={`${listing.sellerAddress}-${index}`}
          as={TrackedLink}
          category={trackingCategory}
          href={
            isMarketplaceV3
              ? listing.type === "direct-listing"
                ? directListingsHref
                : englishAuctionsHref
              : listingsHref
          }
          _hover={{ opacity: 0.75, textDecoration: "none" }}
        >
          <Card p={0} position="relative">
            <AspectRatio w="100%" ratio={1} overflow="hidden" rounded="xl">
              <Skeleton isLoaded={!isLoading}>
                <NFTMediaWithEmptyState
                  metadata={listing.asset}
                  requireInteraction
                  width="100%"
                  height="100%"
                />
              </Skeleton>
            </AspectRatio>
            <Flex p={4} pb={3} gap={1} direction="column">
              <Skeleton w={!isLoading ? "100%" : "50%"} isLoaded={!isLoading}>
                <Heading size="label.md">{listing.asset.name}</Heading>
              </Skeleton>
              <SkeletonText isLoaded={!isLoading}>
                <Text size="body.sm">
                  {listing.type === "direct-listing"
                    ? "Direct Listing"
                    : "English Auction"}
                </Text>
              </SkeletonText>

              <Text size="body.sm" mt={4}>
                Seller
              </Text>
              <SkeletonText isLoaded={!isLoading}>
                <AddressCopyButton address={listing.sellerAddress} size="xs" />
              </SkeletonText>
              <SkeletonText
                as={Badge}
                isLoaded={!isLoading}
                skeletonHeight={3.5}
                noOfLines={1}
                position="absolute"
                rounded="lg"
                size="body.xs"
                p={2}
                top={2}
                right={2}
              >
                <b>{listing.currencyValue.displayValue}</b>{" "}
                {listing.currencyValue.symbol}
              </SkeletonText>
            </Flex>
          </Card>
        </GridItem>
      ))}
    </SimpleGrid>
  );
};
