import { Box, Container, Heading, Stack, Text, chakra } from '@chakra-ui/react';

const BulletList = chakra('ul');
const BulletItem = chakra('li');

function InfoPage() {
  return (
    <Box bg="app.surface" minH="100vh" py={{ base: 10, md: 16 }}>
      <Container maxW="4xl">
        <Stack gap={{ base: 6, md: 8 }}>
          <Heading size="lg" letterSpacing="tight">
            Welcome to Macro Planner
          </Heading>
          <Text color="app.textMuted">
            Macro Planner helps you compose meals that hit precise macronutrient targets by
            optimising the ingredients you choose. Create targets, add your favourite foods, and let
            the solver balance everything for you.
          </Text>

          <Box>
            <Heading size="md" mb={3}>
              Getting Started
            </Heading>
            <BulletList color="rgba(226, 232, 240, 0.85)" pl={6} display="grid" gap={2.5}>
              <BulletItem>
                Create a <strong>meal target</strong> with your desired carbs, protein, and fat goals.
              </BulletItem>
              <BulletItem>
                Add ingredients, including optional minimums, maximums, mandatory grams, or portion
                sizes via the indivisible step.
              </BulletItem>
              <BulletItem>
                Include ingredients from the home dashboard, adjust their constraints, and press
                <em> Calculate</em> (or hit <code>Ctrl / ⌘ + Enter</code>).
              </BulletItem>
              <BulletItem>
                Review the optimisation results, export your data, or iterate until the solution fits your needs.
              </BulletItem>
            </BulletList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Tips
            </Heading>
            <BulletList color="rgba(226, 232, 240, 0.85)" pl={6} display="grid" gap={2.5}>
              <BulletItem>
                Use the indivisible field when an ingredient only comes in fixed increments (e.g.
                5&nbsp;g protein bars).
              </BulletItem>
              <BulletItem>
                Mandatory grams ensure a food is always present &mdash; great for supplements or
                must-have ingredients.
              </BulletItem>
              <BulletItem>
                Export and import meals or ingredients to share presets with teammates or clients.
              </BulletItem>
            </BulletList>
          </Box>

          <Text color="app.textMuted">
            This info page is a placeholder; feel free to replace it with your own copy, brand tone,
            or onboarding guide.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

export default InfoPage;
